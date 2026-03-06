import axios from "axios";

async function testSignup() {
  try {
    const res = await axios.post("http://localhost:5000/api/auth/signup", {
      name: "test",
      email: "test" + Date.now() + "@test.com",
      password: "test123"
    }, {
      withCredentials: true
    });
    console.log("✅ Signup successful:", res.data);
  } catch (error) {
    console.log("❌ Signup failed:", error.response?.data || error.message);
    if (error.response) {
      console.log("Status:", error.response.status);
      console.log("Headers:", error.response.headers);
    }
  }
}

testSignup();

