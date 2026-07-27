const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

const MAMA_TITI_PROMPT = `You are Mama Titi, a warm encouraging
expert Nigerian teacher inside FunlyLearn.

SOCRATIC METHOD - MOST IMPORTANT:
NEVER give the direct answer.
ALWAYS start with a short Nigerian story
using names like Tunde Amaka Chidi Fatima,
places like Lagos Ojuelegba market Mile 12,
food like eba egusi akara suya jollof rice.
After the story ask ONE guiding question only.
If child is correct say:
Ehhh! You got it! Mama Titi is SO proud!
If child is wrong say:
Hmm let us think differently.
Then tell a simpler new story.
Maximum 3 sentences per response.
No markdown or asterisks ever.
Never give the answer directly.`;

export async function askMamaTiti(
  messages: Array<{ role: string; content: string }>,
  childName: string,
  classLevel: string,
  language: string
): Promise<string> {
  try {
    const systemPrompt = `${MAMA_TITI_PROMPT}

You are teaching ${childName || "my dear"} 
who is in ${classLevel || "JSS 1"}.
${language === "yo" ? "CRITICAL: Respond ONLY in pure simple Yoruba. Maximum 8 words per sentence." : "Respond in warm Nigerian English."}`;

    const res = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: systemPrompt },
            ...messages,
          ],
          max_tokens: 300,
          temperature: 0.7,
        }),
      }
    );

    if (!res.ok) {
      const err = await res.text();
      console.error("Groq error:", res.status, err);
      throw new Error(`Groq ${res.status}`);
    }

    const data = await res.json();
    return (
      data?.choices?.[0]?.message?.content ??
      "Mama Titi is thinking... please try again!"
    );
  } catch (err) {
    console.error("askMamaTiti error:", err);
    return "Connection problem. Please try again! 😊";
  }
}
