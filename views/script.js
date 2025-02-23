document.getElementById("register-form")?.addEventListener("submit", async function (event) {
  event.preventDefault();

  const firstName = document.getElementById("firstName").value;
  const lastName = document.getElementById("lastName").value;
  const email = document.getElementById("email").value;
  const mobileNumber = document.getElementById("mobileNumber").value;
  const password = document.getElementById("password").value;

  const response = await fetch("/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
          firstName, lastName, email, mobileNumber, password
      })
  });
  //fetch message from server
  const msgData = await response.json()
  if (response.ok) {
    //   alert("Registration successful!");
    ocument.getElementById("myPopup").style.display = "block";
    document.getElementById('message').innerHTML = msgData.message;
      window.location.href = "/register";
  } else {
      alert("Registration failed!");
  }
});

document.getElementById("forgot-password-form")?.addEventListener("submit", async function (event) {
  event.preventDefault();

  const mobileNumber = document.getElementById("mobileNumber").value;

  const response = await fetch("/verify-mobile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mobileNumber })
  });

  if (response.ok) {
      alert("Mobile number verified! You can reset your password.");
      window.location.href = "reset-password.html";  // Redirect to reset password page
  } else {
      alert("Mobile number not registered!");
  }
});
