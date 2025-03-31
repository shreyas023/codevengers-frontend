import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
  try {
    const { prompt } = await req.json();
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
    });

    return Response.json({ message: completion.choices[0].message.content });
  } catch (error) {
    return Response.json({ error: "Error generating response" }, { status: 500 });
  }
}
