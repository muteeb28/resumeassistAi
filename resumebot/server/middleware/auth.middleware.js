
export const isLoggedIn = (req, res, next) => {
    const token = req.cookies?.token;
    if (!token) {
        return res.status(401).json({ message: 'Unauthorized', code: 'no_token' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Unauthorized', code: 'invalid_token' });
    }
}


export const isAdmin = (req, res, next) => {
    if (!req.user?.admin || req.user?.role !== 'admin') {
        return res.status(403).json({ message: "Forbidden", 'not_admin' });
    }
    next();
}