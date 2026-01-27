import db from "../db/db.js";
const { getPool } = db;
import { redis } from "../db/redis.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const generateTokens = (userId) => {
    const accessToken = jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET || "default_secret", {
        expiresIn: "2d",
    });

    return { accessToken };
};

const setCookies = (res, accessToken) => {
    res.cookie("session", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 2 * 24 * 60 * 60 * 1000, // 2 days in ms
    });
};

export const createUser = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        const { rows: [existingUser] } = await getPool().query(
            'SELECT id FROM users WHERE email = $1',
            [email]
        );

        if (existingUser) {
            return res.status(400).json({ message: "User with this email already exists" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const { rows: [newUser] } = await getPool().query(
            'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id',
            [username, email, hashedPassword]
        );

        res.status(201).json({
            success: true,
            message: "User created successfully",
            userId: newUser.id
        });
    } catch (error) {
        console.error("Error creating user:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
}

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log("Login attempt:", email);

        const { rows: [user] } = await getPool().query(
            'SELECT id, username, email, password, "createdAt" FROM users WHERE email = $1',
            [email]
        );

        if (user && (await bcrypt.compare(password, user.password))) {
            const { accessToken } = generateTokens(user.id);
            setCookies(res, accessToken);

            const redisUser = {
                id: user.id,
                username: user.username,
                email: user.email,
                createdAt: user.createdAt
            };

            await redis.set(
                `auth:${user.id}`,
                JSON.stringify(redisUser),
                'EX',
                2 * 24 * 60 * 60
            );

            res.json({
                id: user.id,
                username: user.username,
                email: user.email,
            });
        } else {
            res.status(400).json({ message: "Invalid email or password" });
        }
    } catch (error) {
        console.error("Error in login controller:", error.message);
        res.status(500).json({ message: error.message });
    }
};

export const authProfile = async (req, res) => {
    try {
        const token = req.cookies?.session;
        if (!token) {
            return res.status(401).json({ message: "No token provided" });
        }

        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET || "default_secret");
        const user = await redis.get(`auth:${decoded.userId}`);

        if (!user) {
            return res.status(401).json({ message: "Your session has expired. Please login again." });
        }

        let parsedUser = null;
        try {
            parsedUser = JSON.parse(user);
        } catch (parseError) {
            return res.status(401).json({ message: "Your session has expired. Please login again." });
        }

        if (parsedUser?.id.toString() !== decoded?.userId.toString()) {
            return res.status(401).json({ message: "Invalid session. Please login again." });
        }

        return res.status(200).json({
            success: true,
            message: 'User is authenticated',
            user: parsedUser
        });
    } catch (error) {
        console.error("Error in authProfile controller:", error.message);
        res.status(500).json({ message: error.message });
    }
}
