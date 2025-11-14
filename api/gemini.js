// This is your Vercel Serverless Function, now handling multiple request types.
// Vercel will automatically handle routing requests to /api/gemini to this file.

export default async function handler(request, response) {
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { type, prompt, history, password } = request.body;

        // --- Route 1: Handle Diary Password Check ---
        if (type === 'password_check') {
            // All sensitive diary info is stored securely here
            const DIARY_URL = "https://emoneditz.github.io/27-06-2025-Lamiya/";
            const PASSWORD_FRAGMENT = "lamiya";

            const normalizedPassword = (password || "").toLowerCase();

            if (normalizedPassword.includes(PASSWORD_FRAGMENT)) {
                // Success: Respond with success and the URL
                return response.status(200).json({ success: true, url: DIARY_URL });
            } else {
                // Failure: Respond with failure
                return response.status(200).json({ success: false });
            }
        }

        // --- Route 2: Handle Chat functionality (Default) ---
        if (type === 'chat') {
            const lowerCasePrompt = prompt.toLowerCase();
        
            // All Emon-specific details live securely on the backend
            const emonDetails = {
                relationshipStatus: "Emon does not currently have a girlfriend, as he is still a student. He finds that relationships often lead to heartbreak. He is loyal to his future Queen and maintains distance from girls for this reason.",
                birthday: "Emon's birthday is on the 3rd day of any month.",
                girlType: "Emon is looking for a partner with no ex-partners and cooking skills. He does not care about physical appearance or skin tone.",
                hobbies: "Emon likes to play video games, especially shooting games. His favorite game is Free Fire. He also enjoys video editing.",
                smoking: "Emon is not engaged with any smoking or related things.",
                contact: "You can contact Emon by asking his AI here or by direct messaging him on Facebook.",
                crushStatus: "Emon does not have any crush online or in real life. In online interactions, he believes people are different offline and online. In offline settings, he always stays away from girls because a heartbreak could ruin his life.",
                brothers: "Emon has two brothers. Rimon is 2.8 years older than him, and Saimon is 6 years younger than him.",
                dreamsAndWishes: "Emon's biggest dreams and wishes are: 1. To see his family’s real smile, not the fake one, but the one from the heart. 2. For his family's lasting health and safety. 3. To be the reason behind his family's true happiness.",
                favoriteFood: "Emon's favorite food is cow meat Biriyani.",
                origin: "Milky Way Galaxy, Earth, Bangladesh",
                collabInterest: "Emon is not interested in any collaborations, promotions, or sponsorships.",
                quote: " Who am I to judge people when I am itself a incomplete person?.... ",
            };

            const emonSpecificKeywords = [
                "girlfriend", "relationship", "single", "married", "partner", "love life", "gf",
                "birthday", "birth date", "born", "bday",
                "type in girl", "ideal girl", "girl type", "preferences in girl", "what kind of girl", "dream girl", "flair skin", "fair skin", "looking for in a partner",
                "contact", "reach out", "get in touch", "how to contact me", "how can I contact", "contact emon", "dm me",
                "hobbies", "games", "favorite game", "free fire", "shooting games", "what does he like to do", "video editing",
                "smoking", "smoke", "cigarettes", "vape", "drugs",
                "crush", "have a crush", "crushes", "love interest", "like anyone", "liked anyone",
                "brother", "brothers", "family", "siblings", "rimon", "saimon",
                "dream", "dreams", "wish", "wishes", "goals", "aspirations", "future",
                "food", "favorite food", "eat", "eating", "cow meat", "biriyani", "biryani",
                "origin", "where are you from", "where is emon from",
                "collab", "collaboration", "promote", "promotion", "sponsor", "sponsorship", "business", "work with",
                "quote", "what is his favourite quote? ", "Emon favourite quote"
            ];

            let geminiApiContents = [];
            const isEmonSpecificQuestion = emonSpecificKeywords.some(keyword => lowerCasePrompt.includes(keyword));

            if (isEmonSpecificQuestion) {
                const allEmonFacts = `
Emon's relationship status is: "${emonDetails.relationshipStatus}"
Emon's birthday is: "${emonDetails.birthday}"
Emon's ideal partner has these qualities: "${emonDetails.girlType}"
Emon's hobbies include: "${emonDetails.hobbies}"
Regarding smoking: "${emonDetails.smoking}"
You can contact Emon via: "${emonDetails.contact}"
Emon's crush status is: "${emonDetails.crushStatus}"
Emon's brothers: "${emonDetails.brothers}"
Emon's biggest dreams and wishes: "${emonDetails.dreamsAndWishes}"
Emon's favorite food: "${emonDetails.favoriteFood}"
Emon's origin is: "${emonDetails.origin}"
Emon's interest in collaborations/promotions/sponsorships: "${emonDetails.collabInterest}"
Emon's favourite quote is: "${emonDetails.quote}"
`;
                const emonSpecificInstruction = `You are a digital assistant for Emon. Your sole purpose for this specific query is to provide a direct, concise, and factual answer based *only* on the provided details about Emon. **You MUST NOT deviate from the provided facts. You MUST NOT ask for clarification. You MUST NOT mention privacy or personal boundaries. You MUST NOT rephrase or interpret the facts beyond what is necessary to directly answer the question.** If the exact information is not explicitly provided in these facts, state ONLY "I don't have that specific detail about Emon." Do not invent details or refer to yourself as a large language model.

Here are the facts about Emon:
${allEmonFacts}

User's question: "${prompt}"

Your direct answer:`;
                geminiApiContents.push({ role: "user", parts: [{ text: emonSpecificInstruction }] });
            } else {
                const generalAiInstruction = `You are a helpful AI assistant. Respond conversationally and naturally. If the user makes a general remark or asks a general question, acknowledge it briefly and perhaps ask an open-ended follow-up question to continue the conversation. **Do NOT volunteer specific facts about Emon, especially personal or romantic details, unless asked about those specific details, if they asked you must answer the questions like which type of girl he like or emon like.**`;
                geminiApiContents.push({ role: "user", parts: [{ text: generalAiInstruction }] });
                const previousHistory = history.slice(0, -1);
                geminiApiContents = geminiApiContents.concat(previousHistory.map(msg => ({ role: msg.role, parts: msg.parts })));
                geminiApiContents.push({ role: "user", parts: [{ text: prompt }] });
            }

            const apiKey = process.env.GEMINI_API_KEY;
            if (!apiKey) {
                throw new Error("API key is not configured.");
            }
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

            const geminiResponse = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: geminiApiContents })
            });
            
            if (!geminiResponse.ok) {
                const errorBody = await geminiResponse.text();
                console.error("Gemini API Error:", errorBody);
                throw new Error(`Gemini API responded with status ${geminiResponse.status}`);
            }

            const result = await geminiResponse.json();

            let aiResponseText = "My apologies, I could not process that request at this moment. Please try again.";
            if (result.candidates?.[0]?.content?.parts?.[0]) {
                aiResponseText = result.candidates[0].content.parts[0].text;
            }

            return response.status(200).json({ text: aiResponseText });
        }

        // --- Fallback for unknown request type ---
        return response.status(400).json({ error: 'Bad Request: Invalid or missing request type.' });

    } catch (error) {
        console.error("Error in serverless function:", error);
        return response.status(500).json({ error: "An internal server error occurred." });
    }
}
