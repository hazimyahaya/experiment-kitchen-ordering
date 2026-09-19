exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }
  try {
    const { image, mediaType } = JSON.parse(event.body);
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return { statusCode: 500, body: JSON.stringify({ error: "Missing API key" }) };
    }
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-5",
        max_tokens: 2000,
        messages: [{
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: mediaType || "image/jpeg", data: image } },
            { type: "text", text: "Baca resit/invois dalam gambar ni. Untuk setiap baris item, ekstrak nama item, kuantiti, dan harga seunit. Balas HANYA dengan JSON array, tiada teks lain, format: [{\"name\":\"...\",\"qty\":number,\"price\":number}]. Jangan reka data - kalau tak jelas, skip baris tu." }
          ]
        }]
      })
    });
    const data = await response.json();
    if (!response.ok) {
      return { statusCode: response.status, body: JSON.stringify({ error: data }) };
    }
    const text = (data.content && data.content[0] && data.content[0].text) || "[]";
    const cleaned = text.replace(/```json|```/g, "").trim();
    return { statusCode: 200, body: cleaned };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
