import User from "../model/user.model.js";
import {redis} from "../db/redis.js";
import jwt from "jsonwebtoken";

const generateTokens = (userId) => {
	const accessToken = jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET, {
		expiresIn: "2d",
	});

	return { accessToken };
};

const setCookies = (res, accessToken) => {
	res.cookie("session", accessToken, {
		httpOnly: true, // prevent XSS attacks, cross site scripting attack
		secure: process.env.NODE_ENV === "production",
		sameSite: "strict", // prevents CSRF attack, cross-site request forgery attack
		maxAge: 2 * 24 * 60 * 60, // 2 days
	});
};

export const createUser = async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const existingUser = await User.findOne({email});
        if (existingUser) {
            return res.status(400).json({message: "user with this email ID alerady exists"});
        }
        const newUser = new User({ username, email, password });
        await newUser.save();
        res.status(201).json({ message: "User created successfully" });
    } catch (error) {
        console.error("Error creating user:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const login = async (req, res) => {
	try {
		const { email, password } = req.body;
        console.log(req.body);
		const user = await User.findOne({ email });

		if (user && (await user.comparePassword(password))) {
			const { accessToken } = generateTokens(user._id);
			setCookies(res, accessToken);

            await redis.set(`auth:${user._id}`, JSON.stringify({_id: user._id, username: user.username, email: user.email, createdAt: user.createdAt}), 'EX', 2 * 24 * 60 * 60); // 7 days expiration
			res.json({
				_id: user._id,
				username: user.username,
				email: user.email,
			});
		} else {
			res.status(400).json({ message: "Invalid email or password" });
		}
	} catch (error) {
		console.log("Error in login controller", error.message);
		res.status(500).json({ message: error.message });
	}
};

export const authProfile = async (req, res) => {
    try {
        const token = req.cookies?.session;
        if (!token) {
            return res.status(401).json({ message: "No token provided"});
        }
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const user =  await redis.get(`auth:${decoded.userId}`);
        const parsedUser = JSON.parse(user);
        if (parsedUser?._id !== decoded?.userId) {
            return res.status(401).json({ message: "Your session has expired. Please login again."});
        }
        return res.status(200).json({ success: true, message: 'user is authenticated', user: parsedUser });
    } catch (error) {
        console.log("Error in authProfile controller", error.message);
        res.status(500).json({ message: error.message });
    }
}