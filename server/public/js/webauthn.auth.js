"use strict";

$("#register").submit(function (event) {
  event.preventDefault();

  let username = this.username.value;
  let name = this.name.value;

  if (!username || !name) {
    alert("Name or username is missing!");
    return;
  }

  getMakeCredentialsChallenge({ username, name })
    .then((response) => {
      const publicKey = preformatMakeCredReq(response);
      return navigator.credentials.create({ publicKey });
    })
    .then((newCredentialInfo) => {
      let makeCredentialsResponse =
        publicKeyCredentialToJSON(newCredentialInfo);
      return sendWebAuthnResponse(makeCredentialsResponse);
    });
});

const getMakeCredentialsChallenge = (formBody) => {
  return fetch("/api/registration", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(formBody),
  })
    .then((response) => response.json())
    .then((response) => {
      if (response.status !== "ok")
        throw new Error(
          `Server responed with error. The message is: ${response.message}`
        );

      return response;
    });
};

const sendWebAuthnResponse = (body) => {
  return fetch("/api/registration", {
    method: "PUT",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  })
    .then((response) => response.json())
    .then((response) => {
      if (response.status !== "ok")
        throw new Error(
          `Server responed with error. The message is: ${response.message}`
        );

      return response;
    });
};
