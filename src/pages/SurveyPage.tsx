import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";

const AUTO_COMMENTS: Record<number, string[]> = {
  1: ["Very poor experience", "Service was unacceptable", "Extremely dissatisfied"],
  2: ["Below expectations", "Needs significant improvement", "Not satisfied with service"],
  3: ["Average experience", "Service was okay", "Room for improvement"],
  4: ["Good experience", "Satisfied with the service", "Minor improvements needed"],
  5: ["Excellent experience", "Outstanding service", "Highly recommend", "Exceeded expectations"],
};

export default function SurveyPage() {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [tokenData, setTokenData] = useState<any>(null);
  const [clientName, setClientName] = useState("");
  const [rating, setRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [selectedComment, setSelectedComment] = useState("");

  useEffect(() => {
    if (!token) { setError("Invalid survey link"); setLoading(false); return; }

    const validate = async () => {
      const { data: rows, error: err } = await (supabase as any)
        .rpc("validate_survey_token", { _token: token });
      const data = Array.isArray(rows) ? rows[0] : null;
      if (err || !data) { setError("Invalid or expired survey link"); setLoading(false); return; }
      if (data.used) { setError("This survey has already been completed. Thank you!"); setLoading(false); return; }
      if (new Date(data.expires_at) < new Date()) { setError("This survey link has expired"); setLoading(false); return; }

      setTokenData(data);
      if (data.client_name) setClientName(data.client_name);
      setLoading(false);
    };
    validate();
  }, [token]);

  const handleSubmit = async () => {
    if (!rating || !selectedComment || !tokenData) return;
    setSubmitting(true);
    try {
      const { error: rpcErr } = await (supabase as any).rpc("submit_survey_response", {
        _token: token,
        _rating: rating,
        _feedback: selectedComment,
      });
      if (rpcErr) throw rpcErr;
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || "Failed to submit survey");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[hsl(195,100%,42%)] to-[hsl(180,100%,35%)]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[hsl(195,100%,42%)] to-[hsl(180,100%,35%)] p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <h2 className="text-xl font-bold text-gray-800 mb-2">{error.includes("already") ? "Survey Completed" : "Survey Unavailable"}</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[hsl(195,100%,42%)] to-[hsl(180,100%,35%)] p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="text-5xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Thank You!</h2>
          <p className="text-gray-600">Your feedback has been submitted successfully. We appreciate your time!</p>
        </div>
      </div>
    );
  }

  const comments = rating ? AUTO_COMMENTS[rating] : [];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[hsl(195,100%,42%)] to-[hsl(180,100%,35%)] p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Rate Your Experience</h1>
          {clientName && <p className="text-gray-500 mt-1">Hi {clientName}, how was your experience?</p>}
        </div>

        {/* Star Rating */}
        <div className="flex justify-center gap-2 mb-6">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => { setRating(star); setSelectedComment(""); }}
              onMouseEnter={() => setHoveredStar(star)}
              onMouseLeave={() => setHoveredStar(0)}
              className="transition-transform hover:scale-110"
            >
              <Star
                className={`h-10 w-10 transition-colors ${
                  star <= (hoveredStar || rating)
                    ? "text-yellow-400 fill-yellow-400"
                    : "text-gray-300"
                }`}
              />
            </button>
          ))}
        </div>

        {rating > 0 && (
          <p className="text-center text-sm font-medium text-gray-600 mb-4">
            {rating === 1 && "Poor"}
            {rating === 2 && "Below Average"}
            {rating === 3 && "Average"}
            {rating === 4 && "Good"}
            {rating === 5 && "Excellent"}
          </p>
        )}

        {/* Auto-generated comments */}
        {comments.length > 0 && (
          <div className="space-y-2 mb-6">
            <p className="text-sm font-medium text-gray-700">Select a comment:</p>
            {comments.map((comment) => (
              <button
                key={comment}
                onClick={() => setSelectedComment(comment)}
                className={`w-full text-left px-4 py-3 rounded-lg border text-sm transition-colors ${
                  selectedComment === comment
                    ? "border-[hsl(195,100%,42%)] bg-[hsl(195,100%,96%)] text-[hsl(195,100%,30%)] font-medium"
                    : "border-gray-200 hover:border-gray-300 text-gray-700"
                }`}
              >
                {comment}
              </button>
            ))}
          </div>
        )}

        <Button
          onClick={handleSubmit}
          disabled={!rating || !selectedComment || submitting}
          className="w-full bg-[hsl(195,100%,42%)] hover:bg-[hsl(195,100%,35%)] text-white"
        >
          {submitting ? "Submitting..." : "Submit Feedback"}
        </Button>
      </div>
    </div>
  );
}
