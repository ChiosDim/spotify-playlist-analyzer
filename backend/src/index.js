import "./instrument.mjs";
import "dotenv/config";
import app from "./app.js";

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Backend running on http://127.0.0.1:${PORT}`);
});
