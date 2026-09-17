import { useState } from "react";
import { X } from "lucide-react";

export default function TagInput({ value = [], onChange, placeholder, error }) {
  const [inputValue, setInputValue] = useState("");

  const addTag = (raw) => {
    const tag = raw.trim();
    if (!tag) return;
    if (value.some((t) => t.toLowerCase() === tag.toLowerCase())) {
      setInputValue("");
      return;
    }
    onChange([...value, tag]);
    setInputValue("");
  };

  const removeTag = (index) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === "Backspace" && inputValue === "" && value.length > 0) {
      removeTag(value.length - 1);
    }
  };

  const handleBlur = () => {
    if (inputValue.trim()) addTag(inputValue);
  };

  return (
    <div
      className={`w-full px-3 py-2 bg-paper border rounded-lg focus-within:ring-2 focus-within:ring-violet-600 flex flex-wrap gap-1.5 items-center ${error ? "border-red-300" : "border-line"}`}
    >
      {value.map((tag, i) => (
        <span
          key={i}
          className="flex items-center gap-1 px-2.5 py-1 bg-violet-50 text-violet-700 text-xs font-medium rounded-full capitalize"
        >
          {tag}
          <button
            type="button"
            onClick={() => removeTag(i)}
            className="hover:text-violet-900"
            title={`Remove ${tag}`}
          >
            <X size={12} />
          </button>
        </span>
      ))}
      <input
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        placeholder={value.length === 0 ? placeholder : "Add another..."}
        className="flex-1 min-w-[120px] bg-transparent text-sm focus:outline-none py-0.5"
      />
    </div>
  );
}