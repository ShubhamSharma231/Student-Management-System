// ========================================
// STUDENT MANAGEMENT SYSTEM - BACKEND
// ========================================

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const db = require("./db");

const app = express();

const PORT = 5000;


// ========================================
// MIDDLEWARE
// ========================================

app.use(cors());
app.use(express.json());


// ========================================
// JWT SECRET
// ========================================

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {

    console.error("JWT_SECRET is missing in .env file.");

    process.exit(1);

}


// ========================================
// AUTHENTICATION MIDDLEWARE
// ========================================

function authenticateToken(req, res, next) {

    const authHeader = req.headers["authorization"];

    const token =
        authHeader &&
        authHeader.split(" ")[1];

    if (!token) {

        return res.status(401).json({
            message: "Access token required."
        });

    }

    jwt.verify(
        token,
        JWT_SECRET,
        (err, user) => {

            if (err) {

                return res.status(403).json({
                    message:
                        "Invalid or expired token."
                });

            }

            req.user = user;

            next();

        }
    );

}


// ========================================
// HOME
// ========================================

app.get("/", (req, res) => {

    res.json({
        message:
            "Student Management API is running!"
    });

});


// ========================================
// LOGIN
// EMAIL OR PHONE + PASSWORD
// ========================================

app.post("/login", (req, res) => {

    const {
        identifier,
        password
    } = req.body;


    if (!identifier || !password) {

        return res.status(400).json({
            message:
                "Email/Phone and password are required."
        });

    }


    const sql = `
        SELECT *
        FROM users
        WHERE email = ?
           OR phone = ?
        LIMIT 1
    `;


    db.query(
        sql,
        [
            identifier,
            identifier
        ],
        async (err, results) => {

            if (err) {

                console.error(
                    "Login database error:",
                    err
                );

                return res.status(500).json({
                    message:
                        "Database error."
                });

            }


            if (results.length === 0) {

                return res.status(401).json({
                    message:
                        "Invalid email/phone or password."
                });

            }


            const user = results[0];


            try {

                const passwordMatch =
                    await bcrypt.compare(
                        password,
                        user.password
                    );


                if (!passwordMatch) {

                    return res.status(401).json({
                        message:
                            "Invalid email/phone or password."
                    });

                }


                const token = jwt.sign(
                    {
                        id: user.id,

                        username:
                            user.username,

                        email:
                            user.email,

                        phone:
                            user.phone
                    },

                    JWT_SECRET,

                    {
                        expiresIn: "2h"
                    }
                );


                res.json({

                    message:
                        "Login successful!",

                    token: token,

                    user: {

                        id: user.id,

                        username:
                            user.username,

                        email:
                            user.email,

                        phone:
                            user.phone

                    }

                });

            } catch (error) {

                console.error(
                    "Authentication error:",
                    error
                );

                res.status(500).json({
                    message:
                        "Authentication error."
                });

            }

        }
    );

});


// ========================================
// FORGOT PASSWORD
// EMAIL OR PHONE
// ========================================

app.post(
    "/forgot-password",
    (req, res) => {

        const {
            identifier
        } = req.body;


        if (!identifier) {

            return res.status(400).json({
                message:
                    "Email or phone number is required."
            });

        }


        const sql = `
            SELECT
                id,
                username,
                email,
                phone
            FROM users
            WHERE email = ?
               OR phone = ?
            LIMIT 1
        `;


        db.query(
            sql,
            [
                identifier,
                identifier
            ],
            (err, results) => {

                if (err) {

                    console.error(
                        "Forgot password error:",
                        err
                    );

                    return res.status(500).json({
                        message:
                            "Database error."
                    });

                }


                if (results.length === 0) {

                    return res.status(404).json({
                        message:
                            "No account found with this email or phone number."
                    });

                }


                const user = results[0];


                const resetToken =
                    crypto
                        .randomBytes(32)
                        .toString("hex");


                const expiresAt =
                    new Date(
                        Date.now() +
                        15 * 60 * 1000
                    );


                const updateSql = `
                    UPDATE users
                    SET reset_token = ?,
                        reset_token_expires = ?
                    WHERE id = ?
                `;


                db.query(
                    updateSql,
                    [
                        resetToken,
                        expiresAt,
                        user.id
                    ],
                    (updateErr) => {

                        if (updateErr) {

                            console.error(
                                "Reset token update error:",
                                updateErr
                            );

                            return res.status(500).json({
                                message:
                                    "Could not create reset token."
                            });

                        }


                        res.json({

                            message:
                                "Password reset token generated.",

                            resetToken:
                                resetToken,

                            expiresIn:
                                "15 minutes"

                        });

                    }
                );

            }
        );

    }
);


// ========================================
// RESET PASSWORD
// EMAIL OR PHONE + TOKEN
// ========================================

app.post(
    "/reset-password",
    async (req, res) => {

        const {
            identifier,
            resetToken,
            newPassword
        } = req.body;


        if (
            !identifier ||
            !resetToken ||
            !newPassword
        ) {

            return res.status(400).json({
                message:
                    "Email/phone, reset token and new password are required."
            });

        }


        if (newPassword.length < 6) {

            return res.status(400).json({
                message:
                    "Password must be at least 6 characters."
            });

        }


        const sql = `
            SELECT id
            FROM users
            WHERE
                (email = ? OR phone = ?)
                AND reset_token = ?
                AND reset_token_expires > NOW()
            LIMIT 1
        `;


        db.query(
            sql,
            [
                identifier,
                identifier,
                resetToken
            ],
            async (err, results) => {

                if (err) {

                    console.error(
                        "Reset password database error:",
                        err
                    );

                    return res.status(500).json({
                        message:
                            "Database error."
                    });

                }


                if (results.length === 0) {

                    return res.status(400).json({
                        message:
                            "Invalid or expired reset token."
                    });

                }


                try {

                    const hashedPassword =
                        await bcrypt.hash(
                            newPassword,
                            10
                        );


                    const updateSql = `
                        UPDATE users
                        SET
                            password = ?,
                            reset_token = NULL,
                            reset_token_expires = NULL
                        WHERE id = ?
                    `;


                    db.query(
                        updateSql,
                        [
                            hashedPassword,
                            results[0].id
                        ],
                        (updateErr) => {

                            if (updateErr) {

                                console.error(
                                    "Password update error:",
                                    updateErr
                                );

                                return res.status(500).json({
                                    message:
                                        "Could not update password."
                                });

                            }


                            res.json({

                                message:
                                    "Password reset successful."

                            });

                        }
                    );

                } catch (error) {

                    console.error(error);

                    res.status(500).json({
                        message:
                            "Password reset error."
                    });

                }

            }
        );

    }
);


// ========================================
// GET ALL STUDENTS
// ========================================

app.get(
    "/students",
    authenticateToken,
    (req, res) => {

        const sql = `
            SELECT *
            FROM students
            ORDER BY id DESC
        `;


        db.query(
            sql,
            (err, results) => {

                if (err) {

                    console.error(err);

                    return res.status(500).json({
                        message:
                            "Database error."
                    });

                }


                res.json(results);

            }
        );

    }
);


// ========================================
// GET STUDENT BY ID
// ========================================

app.get(
    "/students/:id",
    authenticateToken,
    (req, res) => {

        const id =
            req.params.id;


        const sql = `
            SELECT *
            FROM students
            WHERE id = ?
        `;


        db.query(
            sql,
            [id],
            (err, results) => {

                if (err) {

                    console.error(err);

                    return res.status(500).json({
                        message:
                            "Database error."
                    });

                }


                if (results.length === 0) {

                    return res.status(404).json({
                        message:
                            "Student not found."
                    });

                }


                res.json(
                    results[0]
                );

            }
        );

    }
);


// ========================================
// SEARCH STUDENTS
// ========================================

app.get(
    "/students/search",
    authenticateToken,
    (req, res) => {

        const q =
            req.query.q || "";


        const searchValue =
            `%${q}%`;


        const sql = `
            SELECT *
            FROM students
            WHERE name LIKE ?
               OR email LIKE ?
               OR phone LIKE ?
               OR course LIKE ?
               OR CAST(year AS CHAR) LIKE ?
            ORDER BY id DESC
        `;


        db.query(
            sql,
            [
                searchValue,
                searchValue,
                searchValue,
                searchValue,
                searchValue
            ],
            (err, results) => {

                if (err) {

                    console.error(err);

                    return res.status(500).json({
                        message:
                            "Database error."
                    });

                }


                res.json(results);

            }
        );

    }
);


// ========================================
// ADD STUDENT
// ========================================

app.post(
    "/students",
    authenticateToken,
    (req, res) => {

        const {
            name,
            email,
            phone,
            course,
            year
        } = req.body;


        if (
            !name ||
            !email ||
            !phone ||
            !course ||
            !year
        ) {

            return res.status(400).json({
                message:
                    "All student fields are required."
            });

        }


        const sql = `
            INSERT INTO students
            (
                name,
                email,
                phone,
                course,
                year
            )
            VALUES (?, ?, ?, ?, ?)
        `;


        db.query(
            sql,
            [
                name,
                email,
                phone,
                course,
                year
            ],
            (err, result) => {

                if (err) {

                    console.error(err);

                    return res.status(500).json({
                        message:
                            "Could not add student."
                    });

                }


                res.status(201).json({

                    message:
                        "Student added successfully.",

                    studentId:
                        result.insertId

                });

            }
        );

    }
);


// ========================================
// UPDATE STUDENT
// ========================================

app.put(
    "/students/:id",
    authenticateToken,
    (req, res) => {

        const id =
            req.params.id;


        const {
            name,
            email,
            phone,
            course,
            year
        } = req.body;


        if (
            !name ||
            !email ||
            !phone ||
            !course ||
            !year
        ) {

            return res.status(400).json({
                message:
                    "All student fields are required."
            });

        }


        const sql = `
            UPDATE students
            SET
                name = ?,
                email = ?,
                phone = ?,
                course = ?,
                year = ?
            WHERE id = ?
        `;


        db.query(
            sql,
            [
                name,
                email,
                phone,
                course,
                year,
                id
            ],
            (err, result) => {

                if (err) {

                    console.error(err);

                    return res.status(500).json({
                        message:
                            "Could not update student."
                    });

                }


                if (
                    result.affectedRows === 0
                ) {

                    return res.status(404).json({
                        message:
                            "Student not found."
                    });

                }


                res.json({

                    message:
                        "Student updated successfully."

                });

            }
        );

    }
);


// ========================================
// DELETE STUDENT
// ========================================

app.delete(
    "/students/:id",
    authenticateToken,
    (req, res) => {

        const id =
            req.params.id;


        const sql = `
            DELETE FROM students
            WHERE id = ?
        `;


        db.query(
            sql,
            [id],
            (err, result) => {

                if (err) {

                    console.error(err);

                    return res.status(500).json({
                        message:
                            "Could not delete student."
                    });

                }


                if (
                    result.affectedRows === 0
                ) {

                    return res.status(404).json({
                        message:
                            "Student not found."
                    });

                }


                res.json({

                    message:
                        "Student deleted successfully."

                });

            }
        );

    }
);


// ========================================
// TEST API
// ========================================

app.get(
    "/test",
    (req, res) => {

        res.json({
            message:
                "Test API working!"
        });

    }
);


// ========================================
// CREATE DEFAULT ADMIN
// ========================================

async function createDefaultAdmin() {

    const username =
        process.env.ADMIN_USERNAME;

    const password =
        process.env.ADMIN_PASSWORD;


    if (!username || !password) {

        console.log(
            "Admin credentials not found in .env"
        );

        return;

    }


    try {

        const checkSql = `
            SELECT id
            FROM users
            WHERE username = ?
            LIMIT 1
        `;


        db.query(
            checkSql,
            [username],
            async (err, results) => {

                if (err) {

                    console.error(
                        "Admin check error:",
                        err
                    );

                    return;

                }


                if (results.length > 0) {

                    console.log(
                        "Admin user already exists."
                    );

                    return;

                }


                const hashedPassword =
                    await bcrypt.hash(
                        password,
                        10
                    );


                const insertSql = `
                    INSERT INTO users
                    (
                        username,
                        password
                    )
                    VALUES (?, ?)
                `;


                db.query(
                    insertSql,
                    [
                        username,
                        hashedPassword
                    ],
                    (insertErr) => {

                        if (insertErr) {

                            console.error(
                                "Admin creation error:",
                                insertErr
                            );

                            return;

                        }


                        console.log(
                            "Default admin user created."
                        );

                    }
                );

            }
        );

    } catch (error) {

        console.error(
            "Default admin error:",
            error
        );

    }

}


// ========================================
// START SERVER
// ========================================

app.listen(
    PORT,
    () => {

        console.log(
            `Server running on http://localhost:${PORT}`
        );

        createDefaultAdmin();

    }
);