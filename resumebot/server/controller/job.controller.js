import prisma from '../lib/prisma.js'

export const getJobApplications = async (req, res) => {
    try {
        const jobApplications = await prisma.jobApplications.findMany({});
        console.log("job applications fetched: ", jobApplications);
        return res.status(200).json({
            success: true,
            applications: jobApplications
        });
    } catch (error) {
        console.log('error from the getJobApplications controller: ', error);
        res.status(500).json({
            success: false,
            msg: 'Error fetching job applications',
        });
    }
}

export const setJobApplication = async (req, res) => {
    try {
        if (!req.body?.applications || !Array.isArray(req.body?.applications) || req.body?.applications.length === 0) {
            return res.status(400).json({
                success: false,
                message: "application data is required in the request body",
            });
        }
        const result = await prisma.jobApplications.createMany({
            data: req.body.applications,
        });
        if (result.count > 0) {
            return res.status(200).json({
                success: true,
                message: "application submitted successfully!",
            });
        }
        return res.status(500).json({
            success: false,
            message: "error when saving the application. Please try again later."
        })
    } catch (error) {
        console.log("error from the setJobApplication controller: ", error);
        return res.status(500).json({
            success: false,
            message: "error when saving the application. Please try again later."
        })
    }
}

export const editJobApplication = async (req, res) => {
    try {
        if (!req.body?.application || !req.body?.id) {
            return res.status(400).json({
                success: false,
                message: "application data and id are required in the request body",
            });
        }

        const result = await prisma.jobApplications.update({
            where: {
                id: req.body.id
            },
            data: req.body.application,
            select: {id: true}
        });
        if (result.id) {
            return res.status(200).json({
                success: true,
                message: "application updated successfully!",
            })
        }
        return res.status(500).json({
            success: false,
            message: "error when updating the application. Please try again later."
        });
    } catch (error) {
        console.log("error from the editJobApplication controller: ", error);
        return res.status(500).json({
            success: false,
            message: "error when updating the application. Please try again later."
        });
    }
}

export const updateJobApplicationStatus = async (req, res) => {
    try {
        if (!req.body?.id || !req.body?.status) {
            return res.status(400).json({
                success: false,
                message: "application data and id are required in the request body",
            });
        }

        const result = await prisma.jobApplications.update({
            where: {
                id: req.body.id
            },
            data: {
                status: req.body.status
            },
            select: {id: true}
        });
        if (result.id) {
            return res.status(200).json({
                success: true,
                message: "application updated successfully!",
            })
        }
        return res.status(500).json({
            success: false,
            message: "error when updating the application. Please try again later."
        });
    } catch (error) {
        console.log("error from the editJobApplication controller: ", error);
        return res.status(500).json({
            success: false,
            message: "error when updating the application. Please try again later."
        });
    }
}

export const deleteJobApplication = async (req, res) => {
    try {
        if (!req.body?.id) {
            return res.status(400).json({
                success: false,
                message: "application id is required in the request body",
            });
        }

        const result = await prisma.jobApplications.delete({
            where: {
                id: req.body.id
            },
            select: {id: true}
        });
        if (result.id) {
            return res.status(200).json({
                success: true,
                message: "application deleted successfully!",
            });
        }
        return res.status(500).json({
            success: false,
            message: "error when deleting the application. Please try again later."
        });
    } catch (error) {
        console.log("error from the deleteJobApplication controller: ", error);
        return res.status(500).json({
            success: false,
            message: "error when deleting the application. Please try again later."
        });
    }
}