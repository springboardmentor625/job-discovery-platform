import re

from django.contrib.auth import get_user_model
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import Profile
from resumes.parsing import SKILL_KEYWORDS

User = get_user_model()

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    class Meta:
        model = User
        fields = ["id", "username", "email", "password", "role"]
    def create(self, validated_data):
        user = User(username=validated_data["username"], email=validated_data["email"],
                     role=validated_data.get("role", User.Role.JOB_SEEKER))
        user.set_password(validated_data["password"])
        user.save()  # the post_save signal in users/signals.py creates the Profile
        return user

class EmailTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Login accepts EITHER email or username in the same field (User.USERNAME_FIELD
    is "email", so that's the key the frontend posts under). If what's typed
    matches a username instead of an email, we resolve it to that user's real
    email before running normal password validation.
    """
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["email"] = user.email
        token["role"] = user.role
        return token

    def validate(self, attrs):
        identifier = attrs.get(self.username_field, "")
        if identifier and not User.objects.filter(email__iexact=identifier).exists():
            matched_user = User.objects.filter(username__iexact=identifier).first()
            if matched_user:
                attrs[self.username_field] = matched_user.email

        data = super().validate(attrs)
        data["user"] = {"id": self.user.id, "email": self.user.email, "username": self.user.username, "role": self.user.role}
        return data

class ProfileSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source="user.email", read_only=True)
    role = serializers.CharField(source="user.role", read_only=True)

    class Meta:
        model = Profile
        fields = ["id", "email", "role", "bio", "skills", "experience", "portfolio_url"]

    @staticmethod
    def _is_boundary(text, pos):
        """
        True if `pos` is a valid split point: the edge of the string, a
        non-letter character (space, comma, &, /, etc.), or a lowercase-to-
        uppercase transition — e.g. the "n|S" in "PythonSQL", which is how
        two words glued together with no separator at all usually still
        show where one ends and the next begins.
        """
        if pos <= 0 or pos >= len(text):
            return True
        before, after = text[pos - 1], text[pos]
        if not before.isalpha() or not after.isalpha():
            return True
        return before.islower() and after.isupper()

    @classmethod
    def _split_glued_skills(cls, text):
        """
        Find every known skill keyword inside `text` — matching case-
        insensitively, and working even with NO separator at all between
        words (using capitalization transitions as the boundary signal) —
        then split around those matches, keeping whatever falls BETWEEN or
        AROUND them too (e.g. "UI/UX Design"), so nothing typed is lost.
        Returns None if fewer than 2 known skills are found (not enough
        evidence a comma was actually missed).
        """
        matches = []
        for skill in SKILL_KEYWORDS:
            for m in re.finditer(re.escape(skill), text, re.IGNORECASE):
                if cls._is_boundary(text, m.start()) and cls._is_boundary(text, m.end()):
                    matches.append((m.start(), m.end(), skill))

        if len(matches) < 2:
            return None

        matches.sort(key=lambda m: (m[0], -(m[1] - m[0])))
        selected = []
        last_end = -1
        for start, end, skill in matches:
            if start >= last_end:
                selected.append((start, end, skill))
                last_end = end

        pieces = []
        cursor = 0
        for start, end, skill in selected:
            if start > cursor:
                leftover = text[cursor:start].strip(" ,;&/-")
                if leftover:
                    pieces.append(leftover)
            pieces.append(skill)
            cursor = end
        if cursor < len(text):
            leftover = text[cursor:].strip(" ,;&/-")
            if leftover:
                pieces.append(leftover)

        return pieces

    @classmethod
    def _clean_skills_list(cls, raw_skills):
        """
        If a user forgets a comma (or even a space) between skills — e.g.
        "SQL Git & GitHub" or fully glued "PythonSQL" — that whole phrase
        arrives as ONE list entry. This splits it apart automatically when
        2+ known skills are found, grounded in the same keyword list the
        resume parser uses, while preserving any unrecognized leftover text
        (like "UI/UX Design") as its own entry too.
        """
        cleaned = []
        for item in raw_skills:
            item = (item or "").strip()
            if not item:
                continue
            if item.lower() in SKILL_KEYWORDS:
                cleaned.append(item)
                continue
            split_result = cls._split_glued_skills(item)
            if split_result:
                cleaned.extend(split_result)
            else:
                cleaned.append(item)

        seen = set()
        result = []
        for skill in cleaned:
            key = skill.lower()
            if key not in seen:
                seen.add(key)
                result.append(skill)
        return result

    def validate(self, attrs):
        """
        bio, skills, and experience are mandatory on save — portfolio_url is
        the only optional field. Checked against the FINAL merged state (not
        just what's in this request) so it works correctly even though
        MeView uses partial=True for updates.
        """
        if not any(k in attrs for k in ("bio", "skills", "experience", "portfolio_url")):
            return attrs  # a request touching none of these fields (e.g. a plain fetch) — nothing to validate

        if "skills" in attrs:
            attrs["skills"] = self._clean_skills_list(attrs["skills"])

        bio = attrs.get("bio", getattr(self.instance, "bio", ""))
        skills = attrs.get("skills", getattr(self.instance, "skills", []))
        experience = attrs.get("experience", getattr(self.instance, "experience", ""))

        errors = {}
        if not bio:
            errors["bio"] = "Bio is required."
        if not skills:
            errors["skills"] = "Add at least one skill."
        if not experience:
            errors["experience"] = "Experience is required."
        if errors:
            raise serializers.ValidationError(errors)
        return attrs