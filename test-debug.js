import axios from "axios";

async function testSignup() {
  try {
    console.log("Testing signup...");
    const res = await axios.post("http://localhost:5000/api/auth/signup", {
      name: "debugtest",
      email: "debug" + Date.now() + "@test.com",
      password: "test123"
    }, {
      withCredentials: true
    });
    console.log("✅ Signup successful:", res.data);
  } catch (error) {
    console.log("❌ Full error details:");
    console.log("  Message:", error.message);
    if (error.response) {
      console.log("  Status:", error.response.status);
      console.log("  Data:", error.response.data);
    }
    if (error.request) {
      console.log("  Request made, no response");
    }
  }
}

testSignup();

