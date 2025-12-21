import { useState, type FC } from "react";
import Rectangle from "./Rectangle";
import { Building2, Mail, Lock } from "lucide-react";
import { Label } from "../../ui/label";
import { Button } from "../../ui/button";

interface LoginPageProps {
    onLogin: () => void;
}

const LoginPage: FC<LoginPageProps> = ({ onLogin }) => {

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");   

    const handleSubmit = () => {
        // Handle form submission logic here
    }

    return (
        <div className="relative size-full h-screen flex items-center justify-center overflow-hidden -mt-25">
            {/* Background */}
            <div className="absolute inset-0">
                <Rectangle />
            </div>

            {/* Login Form */}
            <div className="relative z-10 w-full max-w-md -mx-10">
                <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 shadow-2xl">
                    {/* Logo and Title */}
                    <div className="flex flex-col items-center mb-8">
                        <div className="w-16 h-16 bg-linear-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                            <Building2 className="w-8 h-6 text-white" />
                        </div>
                        <h1 className="text-white text-2xl mb-2">Building Management System</h1>
                         <p className="text-white/60 text-sm text-center">
                            Sign in to access dashboard
                         </p>
                    </div>
                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-white/80">
                                Email
                            </Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                                <input
                                    id="email"
                                    type="email"
                                    placeholder="admin@building.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="pl-10 h-8 w-full bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:bg-white/15"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-white/80">
                                Password
                            </Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                                <input
                                    id="password"
                                    type="password"
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="pl-10 h-8 w-full bg-white/10 border-white/10 text-white placeholder:text-white/40 focus:bg-white/15 "
                                    required
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full bg-linear-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white shadow-lg"
                        >
                            Sign In
                        </Button>
                    </form>
                </div>
            </div>

        </div>
        
    );

}

export default LoginPage;