async function listAllModels() {
  try {
    console.log("Listing all available models via fetch...");
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();
    if (data.models) {
      data.models.forEach(m => console.log(` - ${m.name}`));
    } else {
      console.log("No models returned:", data);
    }
  } catch (err) {
    console.error("FAILED to list models:");
    console.error(err);
  }
}

listAllModels();
