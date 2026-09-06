// ========================================
// LOGIN SYSTEM
// ========================================

const API_URL = "http://localhost:5000";


// ========================================
// LOGIN FORM
// EMAIL OR PHONE + PASSWORD
// ========================================

document
    .getElementById("loginForm")
    .addEventListener("submit", async function (event) {

        event.preventDefault();

        const identifier =
            document.getElementById("identifier").value.trim();

        const password =
            document.getElementById("password").value;

        const rememberMe =
            document.getElementById("rememberMe").checked;

        const loginMessage =
            document.getElementById("loginMessage");

        loginMessage.textContent = "";

        if (!identifier || !password) {
            loginMessage.textContent =
                "Please enter email/phone and password.";
            return;
        }

        try {

            const response = await fetch(
                `${API_URL}/login`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        identifier: identifier,
                        password: password
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {

                loginMessage.textContent =
                    data.message || "Login failed.";

                return;
            }


            // ========================================
            // LOGIN SUCCESS
            // ========================================

            sessionStorage.setItem(
                "authToken",
                data.token
            );

            sessionStorage.setItem(
                "isLoggedIn",
                "true"
            );

            if (data.user && data.user.username) {

                sessionStorage.setItem(
                    "username",
                    data.user.username
                );
            }


            // ========================================
            // REMEMBER ME
            // ========================================

            if (rememberMe) {

                localStorage.setItem(
                    "savedIdentifier",
                    identifier
                );

            } else {

                localStorage.removeItem(
                    "savedIdentifier"
                );
            }


            loginMessage.textContent =
                "Login successful!";

            setTimeout(() => {

                window.location.href = "index.html";

            }, 500);


        } catch (error) {

            console.error("Login error:", error);

            loginMessage.textContent =
                "Unable to connect to server.";
        }

    });


// ========================================
// LOAD SAVED EMAIL / PHONE
// ========================================

window.addEventListener(
    "DOMContentLoaded",
    function () {

        const savedIdentifier =
            localStorage.getItem("savedIdentifier");

        if (savedIdentifier) {

            const identifierInput =
                document.getElementById("identifier");

            const rememberMe =
                document.getElementById("rememberMe");

            if (identifierInput) {

                identifierInput.value =
                    savedIdentifier;
            }

            if (rememberMe) {

                rememberMe.checked = true;
            }
        }

    }
);


// ========================================
// FORGOT PASSWORD
// ========================================

async function forgotPassword() {

    const identifier =
        prompt(
            "Enter your email or phone number:"
        );

    if (!identifier) {
        return;
    }

    try {

        const response = await fetch(
            `${API_URL}/forgot-password`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    identifier: identifier.trim()
                })
            }
        );

        const data =
            await response.json();

        if (!response.ok) {

            alert(
                data.message ||
                "Unable to generate reset token."
            );

            return;
        }


        // ========================================
        // SHOW TOKEN
        // ========================================

        showResetToken(
            identifier.trim(),
            data.resetToken
        );


    } catch (error) {

        console.error(
            "Forgot password error:",
            error
        );

        alert(
            "Unable to connect to server."
        );
    }
}


// ========================================
// SHOW RESET TOKEN
// ========================================

function showResetToken(identifier, token) {

    const overlay =
        document.createElement("div");

    overlay.id =
        "tokenModalOverlay";

    overlay.style.position = "fixed";
    overlay.style.top = "0";
    overlay.style.left = "0";
    overlay.style.width = "100%";
    overlay.style.height = "100%";
    overlay.style.background =
        "rgba(0, 0, 0, 0.6)";
    overlay.style.display = "flex";
    overlay.style.alignItems = "center";
    overlay.style.justifyContent = "center";
    overlay.style.zIndex = "9999";
    overlay.style.padding = "20px";
    overlay.style.boxSizing = "border-box";


    // ========================================
    // CARD
    // ========================================

    const card =
        document.createElement("div");

    card.style.background = "#ffffff";
    card.style.width = "100%";
    card.style.maxWidth = "450px";
    card.style.padding = "25px";
    card.style.borderRadius = "15px";
    card.style.boxSizing = "border-box";
    card.style.textAlign = "center";
    card.style.boxShadow =
        "0 10px 30px rgba(0,0,0,0.25)";


    // ========================================
    // HEADING
    // ========================================

    const heading =
        document.createElement("h2");

    heading.textContent =
        "Password Reset Token";

    heading.style.marginBottom =
        "10px";


    // ========================================
    // DESCRIPTION
    // ========================================

    const description =
        document.createElement("p");

    description.textContent =
        "Your reset token is valid for 15 minutes.";

    description.style.marginBottom =
        "15px";


    // ========================================
    // TOKEN INPUT
    // ========================================

    const tokenInput =
        document.createElement("input");

    tokenInput.type = "text";
    tokenInput.value = token;
    tokenInput.readOnly = true;

    tokenInput.style.width = "100%";
    tokenInput.style.padding = "12px";
    tokenInput.style.boxSizing = "border-box";
    tokenInput.style.border =
        "1px solid #ccc";
    tokenInput.style.borderRadius =
        "8px";
    tokenInput.style.marginBottom =
        "10px";
    tokenInput.style.fontSize = "14px";


    // ========================================
    // COPY BUTTON
    // ========================================

    const copyButton =
        document.createElement("button");

    copyButton.type = "button";

    copyButton.textContent =
        "Copy Token";

    copyButton.style.width = "100%";
    copyButton.style.padding = "12px";
    copyButton.style.border = "none";
    copyButton.style.borderRadius = "8px";
    copyButton.style.cursor = "pointer";
    copyButton.style.marginBottom = "10px";
    copyButton.style.fontSize = "15px";


    copyButton.addEventListener(
        "click",
        async function () {

            try {

                await navigator.clipboard.writeText(
                    token
                );

                copyButton.textContent =
                    "✓ Token Copied!";

            } catch (error) {

                tokenInput.focus();
                tokenInput.select();

                try {

                    document.execCommand("copy");

                    copyButton.textContent =
                        "✓ Token Copied!";

                } catch (copyError) {

                    alert(
                        "Copy failed. Please copy the token manually."
                    );
                }
            }
        }
    );


    // ========================================
    // CONTINUE BUTTON
    // ========================================

    const continueButton =
        document.createElement("button");

    continueButton.type = "button";

    continueButton.textContent =
        "Continue";

    continueButton.style.width = "100%";
    continueButton.style.padding = "12px";
    continueButton.style.border = "none";
    continueButton.style.borderRadius = "8px";
    continueButton.style.cursor = "pointer";
    continueButton.style.fontSize = "15px";


    continueButton.addEventListener(
        "click",
        function () {

            overlay.remove();

            showNewPasswordModal(
                identifier,
                token
            );
        }
    );


    // ========================================
    // ADD ELEMENTS
    // ========================================

    card.appendChild(heading);
    card.appendChild(description);
    card.appendChild(tokenInput);
    card.appendChild(copyButton);
    card.appendChild(continueButton);

    overlay.appendChild(card);

    document.body.appendChild(overlay);
}


// ========================================
// NEW PASSWORD MODAL
// ========================================

function showNewPasswordModal(identifier, token) {

    const overlay =
        document.createElement("div");

    overlay.id =
        "passwordResetOverlay";

    overlay.style.position = "fixed";
    overlay.style.top = "0";
    overlay.style.left = "0";
    overlay.style.width = "100%";
    overlay.style.height = "100%";
    overlay.style.background =
        "rgba(0, 0, 0, 0.6)";
    overlay.style.display = "flex";
    overlay.style.alignItems = "center";
    overlay.style.justifyContent = "center";
    overlay.style.zIndex = "9999";
    overlay.style.padding = "20px";
    overlay.style.boxSizing = "border-box";


    // ========================================
    // CARD
    // ========================================

    const card =
        document.createElement("div");

    card.style.background = "#ffffff";
    card.style.width = "100%";
    card.style.maxWidth = "450px";
    card.style.padding = "25px";
    card.style.borderRadius = "15px";
    card.style.boxSizing = "border-box";
    card.style.boxShadow =
        "0 10px 30px rgba(0,0,0,0.25)";


    // ========================================
    // HEADING
    // ========================================

    const heading =
        document.createElement("h2");

    heading.textContent =
        "Reset Password";

    heading.style.textAlign = "center";
    heading.style.marginBottom = "8px";


    // ========================================
    // DESCRIPTION
    // ========================================

    const description =
        document.createElement("p");

    description.textContent =
        "Create a new password for your account.";

    description.style.textAlign = "center";
    description.style.marginBottom = "20px";


    // ========================================
    // NEW PASSWORD
    // ========================================

    const newPasswordLabel =
        document.createElement("label");

    newPasswordLabel.textContent =
        "New Password";

    newPasswordLabel.style.display =
        "block";

    newPasswordLabel.style.marginBottom =
        "6px";


    const newPasswordInput =
        document.createElement("input");

    newPasswordInput.type =
        "password";

    newPasswordInput.placeholder =
        "Minimum 6 characters";

    newPasswordInput.style.width = "100%";
    newPasswordInput.style.padding = "12px";
    newPasswordInput.style.boxSizing =
        "border-box";

    newPasswordInput.style.border =
        "1px solid #ccc";

    newPasswordInput.style.borderRadius =
        "8px";

    newPasswordInput.style.marginBottom =
        "15px";


    // ========================================
    // CONFIRM PASSWORD
    // ========================================

    const confirmPasswordLabel =
        document.createElement("label");

    confirmPasswordLabel.textContent =
        "Confirm Password";

    confirmPasswordLabel.style.display =
        "block";

    confirmPasswordLabel.style.marginBottom =
        "6px";


    const confirmPasswordInput =
        document.createElement("input");

    confirmPasswordInput.type =
        "password";

    confirmPasswordInput.placeholder =
        "Re-enter your password";

    confirmPasswordInput.style.width = "100%";

    confirmPasswordInput.style.padding =
        "12px";

    confirmPasswordInput.style.boxSizing =
        "border-box";

    confirmPasswordInput.style.border =
        "1px solid #ccc";

    confirmPasswordInput.style.borderRadius =
        "8px";

    confirmPasswordInput.style.marginBottom =
        "10px";


    // ========================================
    // MESSAGE
    // ========================================

    const message =
        document.createElement("p");

    message.style.minHeight =
        "20px";

    message.style.marginBottom =
        "10px";

    message.style.fontSize =
        "14px";


    // ========================================
    // RESET BUTTON
    // ========================================

    const resetButton =
        document.createElement("button");

    resetButton.type = "button";

    resetButton.textContent =
        "Reset Password";

    resetButton.style.width = "100%";
    resetButton.style.padding = "12px";
    resetButton.style.border = "none";
    resetButton.style.borderRadius = "8px";
    resetButton.style.cursor = "pointer";
    resetButton.style.fontSize = "15px";
    resetButton.style.marginBottom = "10px";


    // ========================================
    // CANCEL BUTTON
    // ========================================

    const cancelButton =
        document.createElement("button");

    cancelButton.type = "button";

    cancelButton.textContent =
        "Cancel";

    cancelButton.style.width = "100%";
    cancelButton.style.padding = "12px";
    cancelButton.style.border = "1px solid #ccc";
    cancelButton.style.borderRadius = "8px";
    cancelButton.style.cursor = "pointer";
    cancelButton.style.fontSize = "15px";


    // ========================================
    // RESET PASSWORD
    // ========================================

    resetButton.addEventListener(
        "click",
        async function () {

            const newPassword =
                newPasswordInput.value;

            const confirmPassword =
                confirmPasswordInput.value;


            message.textContent = "";
            message.style.color = "";


            // Empty check
            if (!newPassword || !confirmPassword) {

                message.textContent =
                    "Please enter both password fields.";

                return;
            }


            // Minimum length
            if (newPassword.length < 6) {

                message.textContent =
                    "Password must be at least 6 characters.";

                return;
            }


            // Password match
            if (newPassword !== confirmPassword) {

                message.textContent =
                    "Passwords do not match.";

                return;
            }


            resetButton.disabled = true;

            resetButton.textContent =
                "Resetting...";


            try {

                const response =
                    await fetch(
                        `${API_URL}/reset-password`,
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body: JSON.stringify({

                                identifier:
                                    identifier,

                                resetToken:
                                    token,

                                newPassword:
                                    newPassword

                            })
                        }
                    );


                const data =
                    await response.json();


                if (!response.ok) {

                    message.textContent =
                        data.message ||
                        "Password reset failed.";

                    resetButton.disabled =
                        false;

                    resetButton.textContent =
                        "Reset Password";

                    return;
                }


                // ========================================
                // SUCCESS
                // ========================================

                overlay.remove();

                alert(
                    "Password reset successful!\n\n" +
                    "You can now login with your new password."
                );


            } catch (error) {

                console.error(
                    "Reset password error:",
                    error
                );

                message.textContent =
                    "Unable to connect to server.";

                resetButton.disabled =
                    false;

                resetButton.textContent =
                    "Reset Password";
            }

        }
    );


    // ========================================
    // CANCEL
    // ========================================

    cancelButton.addEventListener(
        "click",
        function () {

            overlay.remove();

        }
    );


    // ========================================
    // ADD ELEMENTS
    // ========================================

    card.appendChild(heading);
    card.appendChild(description);

    card.appendChild(newPasswordLabel);
    card.appendChild(newPasswordInput);

    card.appendChild(confirmPasswordLabel);
    card.appendChild(confirmPasswordInput);

    card.appendChild(message);

    card.appendChild(resetButton);
    card.appendChild(cancelButton);

    overlay.appendChild(card);

    document.body.appendChild(overlay);

    newPasswordInput.focus();
}


// ========================================
// CLOSE OLD RESET PASSWORD MODAL
// ========================================

function closeResetPassword() {

    const modal =
        document.getElementById(
            "resetPasswordModal"
        );

    if (modal) {

        modal.style.display =
            "none";
    }
}


// ========================================
// OLD RESET PASSWORD FORM
// ========================================

const resetPasswordForm =
    document.getElementById(
        "resetPasswordForm"
    );


if (resetPasswordForm) {

    resetPasswordForm.addEventListener(
        "submit",
        function (event) {

            event.preventDefault();

            const resetMessage =
                document.getElementById(
                    "resetMessage"
                );

            if (resetMessage) {

                resetMessage.textContent =
                    "Please use Forgot Password to reset your password.";
            }

        }
    );
}