import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error("MONGODB_URI is not set");
    process.exit(1);
}

const adminSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, default: 'Operator Konten' },
    avatar: { type: String, default: '👨‍💻' }
});

const Admin = mongoose.models.Admin || mongoose.model('Admin', adminSchema);

async function seed() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log("Connected to MongoDB");

        const admins = [
            { username: "admin", password: "Admin@123", role: "Super Admin", avatar: "👨‍💻" },
            { username: "operator1", password: "Operator@2025", role: "Operator Konten", avatar: "🛠️" }
        ];

        for (let admin of admins) {
            const existing = await Admin.findOne({ username: admin.username });
            if (!existing) {
                const hashedPassword = await bcrypt.hash(admin.password, 10);
                await Admin.create({
                    username: admin.username,
                    password: hashedPassword,
                    role: admin.role,
                    avatar: admin.avatar
                });
                console.log(`Created admin: ${admin.username}`);
            } else {
                console.log(`Admin ${admin.username} already exists`);
            }
        }

        console.log("Seeding complete!");
        process.exit(0);
    } catch (error) {
        console.error("Seeding error:", error);
        process.exit(1);
    }
}

seed();