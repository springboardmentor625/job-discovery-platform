import { State, City } from 'country-state-city';

// Fetch all Indian states
const indianStates = State.getStatesOfCountry('IN');

// Generate an exhaustive object of States -> [Cities]
export const ALL_INDIAN_STATES_AND_CITIES = indianStates.reduce((acc, state) => {
  const cities = City.getCitiesOfState('IN', state.isoCode);
  // Ensure we at least provide an empty array or single item if no cities found
  acc[state.name] = cities.length > 0 ? cities.map(city => city.name) : [state.name];
  return acc;
}, {});

export const IT_HUBS_STATES_AND_CITIES = {
  "Karnataka": ["Bangalore", "Mysore"],
  "Telangana": ["Hyderabad"],
  "Maharashtra": ["Pune", "Mumbai", "Navi Mumbai", "Nagpur"],
  "Tamil Nadu": ["Chennai", "Coimbatore"],
  "Delhi NCR": ["Gurgaon", "Noida", "New Delhi"],
  "Gujarat": ["Ahmedabad", "Gandhinagar"],
  "Kerala": ["Thiruvananthapuram", "Kochi"],
  "West Bengal": ["Kolkata"],
  "Uttar Pradesh": ["Noida"]
};

export const EDUCATION_DATA = {
  "B.Tech / B.E.": [
    "Computer Science Engineering (CSE)",
    "Information Technology (IT)",
    "Electronics and Communication (ECE)",
    "Mechanical Engineering",
    "Civil Engineering",
    "Electrical Engineering"
  ],
  "BCA": ["General", "Cloud Computing", "Data Science", "AI & ML"],
  "MCA": ["General", "Software Engineering", "AI & ML", "Data Science"],
  "B.Sc": ["Computer Science", "Information Technology", "Mathematics", "Physics"],
  "M.Tech / M.E.": ["Computer Science", "Software Engineering", "VLSI Design", "Structural Engineering", "Thermal Engineering"],
  "Other": ["Other"]
};
