/**
 * Switch to login page
 */
$("#toLogin").click(function (e) {
  e.preventDefault();
  $("#registerContainer").hide();
  $("#loginContainer").show();
});

/**
 * Switch to registration page
 */
$("#toRegistration").click(function (e) {
  e.preventDefault();
  $("#loginContainer").hide();
  $("#registerContainer").show();
});

let loadMainContainer = () => {
  return fetch("/api/login/info", { credentials: "include" })
    .then((response) => response.json())
    .then((response) => {
      if (response.registered === true) {
        $("#theSecret").html(response.challenge);
        $("#name").html(response.username);
        $("#registerContainer").hide();
        $("#loginContainer").hide();
        $("#mainContainer").show();
      } else {
        alert(`Error! ${response.message}`);
      }
    });
};

let checkIfLoggedIn = () => {
  return fetch("/api/login/status", { credentials: "include" })
    .then((response) => response.json())
    .then((response) => {
      if (response.registered === true) {
        return true;
      } else {
        return false;
      }
    });
};

$("#logoutButton").click(() => {
  fetch("/api/login/logout", { credentials: "include" });
  $("#registerContainer").hide();
  $("#mainContainer").hide();
  $("#loginContainer").show();
});
