import React, { useState, useEffect } from "react";
import { User, Shield, Sliders, Check, Plus, Trash2, Save } from "lucide-react";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Badge from "../../components/ui/Badge";
import apiClient from "../../services/apiClient";
import { useAuth } from "../../hooks/useAuth";

const DIETARY_OPTIONS = [
  "Vegetarian",
  "Vegan",
  "Gluten-Free",
  "Dairy-Free",
  "Nut-Free",
  "Halal",
  "Kosher",
  "Keto",
  "Low-Sodium",
];

export const Settings = () => {
  const { user } = useAuth();
  const [selectedDiet, setSelectedDiet] = useState(["Vegetarian"]);
  const [allergies, setAllergies] = useState(["Peanuts", "Shellfish"]);
  const [newAllergy, setNewAllergy] = useState("");
  const [dislikedIngredients, setDislikedIngredients] = useState(["Cilantro"]);
  const [newDisliked, setNewDisliked] = useState("");
  const [defaultServings, setDefaultServings] = useState(2);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    // Load existing user preferences
    apiClient
      .get("/preferences")
      .then((res) => {
        const p = res.data?.data?.preferences;
        if (p) {
          if (p.dietaryPreferences) setSelectedDiet(p.dietaryPreferences);
          if (p.allergies) setAllergies(p.allergies);
          if (p.dislikedIngredients) setDislikedIngredients(p.dislikedIngredients);
          if (p.defaultServings) setDefaultServings(p.defaultServings);
        }
      })
      .catch(() => {});
  }, []);

  const handleToggleDiet = (diet) => {
    setSelectedDiet((prev) =>
      prev.includes(diet) ? prev.filter((d) => d !== diet) : [...prev, diet]
    );
  };

  const handleAddAllergy = (e) => {
    e.preventDefault();
    if (!newAllergy.trim() || allergies.includes(newAllergy.trim())) return;
    setAllergies((prev) => [...prev, newAllergy.trim()]);
    setNewAllergy("");
  };

  const handleRemoveAllergy = (allergy) => {
    setAllergies((prev) => prev.filter((a) => a !== allergy));
  };

  const handleAddDisliked = (e) => {
    e.preventDefault();
    if (!newDisliked.trim() || dislikedIngredients.includes(newDisliked.trim()))
      return;
    setDislikedIngredients((prev) => [...prev, newDisliked.trim()]);
    setNewDisliked("");
  };

  const handleRemoveDisliked = (item) => {
    setDislikedIngredients((prev) => prev.filter((d) => d !== item));
  };

  const handleSavePreferences = async () => {
    try {
      await apiClient.put("/preferences", {
        dietaryPreferences: selectedDiet,
        allergies,
        dislikedIngredients,
        defaultServings: parseInt(defaultServings, 10),
      });
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (err) {
      alert(err.message || "Failed to update preferences");
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#272A1F] tracking-tight">
          Account & Culinary Settings
        </h2>
        <p className="text-sm text-[#5E5947]">
          Customize diet guardrails, allergy safety filters, and kitchen defaults.
        </p>
      </div>

      {/* User Profile Summary */}
      <div className="p-6 rounded-3xl bg-white border border-[#D8C6A5]/40 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#8A9070] text-white flex items-center justify-center font-bold text-lg shadow-xs">
            <User className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#272A1F]">
              {user?.name || "Chef User"}
            </h3>
            <p className="text-xs text-[#5E5947]">
              {user?.email || "chef@pantrypal.app"} • Role: {user?.role || "user"}
            </p>
          </div>
        </div>

        <Badge variant="primary" size="md">
          Active Subscriber
        </Badge>
      </div>

      {/* Dietary Guardrails */}
      <div className="p-6 rounded-3xl bg-white border border-[#D8C6A5]/40 shadow-sm space-y-4">
        <h3 className="text-lg font-bold text-[#272A1F]">Dietary Guardrails</h3>
        <p className="text-xs text-[#5E5947]">
          AI recommendations and recipe matching will automatically enforce these filters.
        </p>

        <div className="flex flex-wrap gap-2 pt-2">
          {DIETARY_OPTIONS.map((diet) => {
            const isChecked = selectedDiet.includes(diet);
            return (
              <button
                key={diet}
                type="button"
                onClick={() => handleToggleDiet(diet)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer inline-flex items-center gap-2 ${
                  isChecked
                    ? "bg-[#8A9070] text-white border-[#8A9070] shadow-2xs"
                    : "bg-[#FAF8F3] text-[#272A1F] border-[#D8C6A5]/50 hover:bg-[#B8C39A]/20"
                }`}
              >
                {isChecked && <Check className="w-3.5 h-3.5" />}
                <span>{diet}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Allergies & Safety Exclusion */}
      <div className="p-6 rounded-3xl bg-white border border-[#D8C6A5]/40 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-rose-800">
          <Shield className="w-5 h-5" />
          <h3 className="text-lg font-bold">Allergy Safety Filters</h3>
        </div>
        <p className="text-xs text-[#5E5947]">
          Zero tolerance: Any recipe containing these ingredients will be flagged and excluded.
        </p>

        <div className="flex flex-wrap gap-2 pt-2">
          {allergies.map((allergy) => (
            <span
              key={allergy}
              className="px-3 py-1 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold inline-flex items-center gap-1.5"
            >
              <span>{allergy}</span>
              <button
                type="button"
                onClick={() => handleRemoveAllergy(allergy)}
                className="hover:text-rose-950 cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>

        <form onSubmit={handleAddAllergy} className="flex gap-2 pt-2 max-w-sm">
          <Input
            placeholder="Add allergy (e.g. Soy, Tree nuts)"
            value={newAllergy}
            onChange={(e) => setNewAllergy(e.target.value)}
          />
          <Button type="submit" variant="outline" size="sm" icon={Plus}>
            Add
          </Button>
        </form>
      </div>

      {/* Disliked Ingredients */}
      <div className="p-6 rounded-3xl bg-white border border-[#D8C6A5]/40 shadow-sm space-y-4">
        <h3 className="text-lg font-bold text-[#272A1F]">
          Disliked Ingredients
        </h3>
        <p className="text-xs text-[#5E5947]">
          Recipes will avoid or suggest substitutions for these items.
        </p>

        <div className="flex flex-wrap gap-2 pt-2">
          {dislikedIngredients.map((item) => (
            <span
              key={item}
              className="px-3 py-1 rounded-xl bg-[#FAF8F3] border border-[#D8C6A5]/50 text-[#272A1F] text-xs font-semibold inline-flex items-center gap-1.5"
            >
              <span>{item}</span>
              <button
                type="button"
                onClick={() => handleRemoveDisliked(item)}
                className="text-[#5E5947] hover:text-red-600 cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>

        <form onSubmit={handleAddDisliked} className="flex gap-2 pt-2 max-w-sm">
          <Input
            placeholder="Add item (e.g. Celery, Olives)"
            value={newDisliked}
            onChange={(e) => setNewDisliked(e.target.value)}
          />
          <Button type="submit" variant="outline" size="sm" icon={Plus}>
            Add
          </Button>
        </form>
      </div>

      {/* Save Button Bar */}
      <div className="flex items-center justify-between p-4 rounded-2xl bg-white border border-[#D8C6A5]/40 shadow-sm">
        <span className="text-xs text-[#5E5947]">
          {isSaved ? "✅ Preferences saved successfully!" : "Ensure changes are saved before cooking."}
        </span>

        <Button
          variant="primary"
          size="lg"
          icon={Save}
          onClick={handleSavePreferences}
          className="shadow-sm"
        >
          Save Preferences
        </Button>
      </div>
    </div>
  );
};

export default Settings;
