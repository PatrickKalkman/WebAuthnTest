"use strict";

$("#register").submit(async function (event) {
  event.preventDefault();

  const username = this.username.value;
  const name = this.name.value;

  if (!username || !name) {
    alert("Name or username is missing!");
    return;
  }

  const response = await getMakeCredentialsChallenge({ username, name });
  const publicKey = preformatMakeCredReq(response);
  const newCredentialInfo = await navigator.credentials.create({ publicKey });
  const makeCredentialsResponse = publicKeyCredentialToJSON(newCredentialInfo);
  const responseJson = await sendWebAuthnResponse(makeCredentialsResponse);
});

/* Handle for login form submission */
$("#login").submit(async function (event) {
  event.preventDefault();

  const username = this.username.value;

  if (!username) {
    alert("Username is missing!");
    return;
  }

  const response = await getGetAssertionChallenge({ username });
  const publicKey = preformatGetAssertReq(response);
  const credential = await navigator.credentials.get({ publicKey });
  const getAssertionResponse = publicKeyCredentialToJSON(credential);
  const responseJson = await sendWebAuthnResponse(getAssertionResponse);
  loadMainContainer();
});

const getMakeCredentialsChallenge = async (formBody) => {
  const response = await fetch("/api/registration", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(formBody),
  });
  const responseJson = await response.json();
  if (responseJson.status !== "ok")
    throw new Error(
      `Server responed with error. The message is: ${responseJson.message}`
    );
  return responseJson;
};

const sendWebAuthnResponse = async (body) => {
  const response = await fetch("/api/registration", {
    method: "PUT",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const responseJson = await response.json();
  if (responseJson.status !== "ok") {
    throw new Error(
      `Server responed with error. The message is: ${response_1.message}`
    );
  }
  return responseJson;
};

const getGetAssertionChallenge = async (formBody) => {
  const response = await fetch("/api/login", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(formBody),
  });
  const responseJson = await response.json();
  if (responseJson.status !== "ok") {
    throw new Error(
      `Server responed with error. The message is: ${response.message}`
    );
  }

  return responseJson;
};
