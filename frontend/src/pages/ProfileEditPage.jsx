import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ResearcherProfileForm from "../components/ResearcherProfileForm.jsx";
import { getApiError } from "../services/api.js";
import { getMyProfile, updateMyProfile } from "../services/profileService.js";

export default function ProfileEditPage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    getMyProfile()
      .then(setProfile)
      .catch((err) => setError(getApiError(err, "Unable to load profile.")))
      .finally(() => setLoading(false));
  }, []);

  const save = async (payload) => {
    setSaving(true);
    setError("");
    setStatus("");
    try {
      const updated = await updateMyProfile(payload);
      setProfile(updated);
      setStatus("Profile saved.");
    } catch (err) {
      setError(getApiError(err, "Unable to save profile."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <div className="rounded-2xl border border-line bg-card p-8 shadow-sm">
        <h1 className="font-serif text-3xl font-semibold text-navy">Edit profile</h1>
        <p className="mt-2 text-sm text-muted">These details appear on your public researcher profile.</p>
        <Link to="/researcher" className="mt-3 inline-block text-sm font-medium text-blue hover:underline">
          Back to dashboard
        </Link>
        {loading ? (
          <p className="mt-6 text-sm text-muted">Loading profile...</p>
        ) : profile ? (
          <div className="mt-8">
            <ResearcherProfileForm
              key={profile.updated_at || profile.user_id}
              initial={profile}
              onSubmit={save}
              saving={saving}
              error={error}
              status={status}
            />
          </div>
        ) : (
          <p className="mt-6 text-sm text-amber-900">{error || "Unable to load profile."}</p>
        )}
      </div>
    </div>
  );
}
