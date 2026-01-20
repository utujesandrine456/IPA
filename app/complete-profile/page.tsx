"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Building,
  Handshake,
  Check,
  Upload,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";

export default function CompleteProfilePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [student, setStudent] = useState<any>(null);
  const [step, setStep] = useState(1);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [supervisors, setSupervisors] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
    phone: "",
    address: "",
    companyName: "",
    companyAddress: "",
    companyPhone: "",
    companyEmail: "",
    supervisorName: "",
    supervisorEmail: "",
    internshipStart: "",
    internshipEnd: "",
    supervisorId: "",
  });

  useEffect(() => {
    if (!token) {
      alert("Invalid or missing token");
      router.push("/");
      return;
    }

    fetch(`/api/students/complete-profile?token=${token}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          alert(data.error);
          router.push("/");
          return;
        }

        setStudent(data.student);
        setFormData((prev) => ({
          ...prev,
          phone: data.student.phone || "",
          address: data.student.address || "",
          companyName: data.student.companyName || "",
          companyAddress: data.student.companyAddress || "",
          companyPhone: data.student.companyPhone || "",
          companyEmail: data.student.companyEmail || "",
          supervisorName: data.student.supervisorName || "",
          supervisorEmail: data.student.supervisorEmail || "",
          internshipStart: data.student.internshipStart
            ? new Date(data.student.internshipStart).toISOString().split("T")[0]
            : "",
          internshipEnd: data.student.internshipEnd
            ? new Date(data.student.internshipEnd).toISOString().split("T")[0]
            : "",
          supervisorId: data.student.supervisorId?.toString() || "", // Pre-fill if exists
        }));
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error:", error);
        alert("Failed to load profile");
        router.push("/");
      });

    fetch("/api/superteacher/supervisors")
      .then((res) => res.json())
      .then((data) => {
        if (data.supervisors) {
          setSupervisors(data.supervisors);
        }
      })
      .catch((error) => console.error("Error fetching supervisors:", error));
  }, [router, token]);

  const nextStep = () => setStep((prev) => Math.min(prev + 1, 3));
  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));

  const handleSupervisorSelect = (selectedId: string) => {
    const selectedSupervisor = supervisors.find((sup) => sup.id === Number(selectedId));
    if (selectedSupervisor) {
      setFormData((prev) => ({
        ...prev,
        supervisorId: selectedId,
        supervisorName: selectedSupervisor.user?.name || "",
        supervisorEmail: selectedSupervisor.user?.email || "",
      }));
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (formData.password && formData.password !== formData.confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    if (formData.password && formData.password.length < 6) {
      alert("Password must be at least 6 characters");
      return;
    }

    if (!formData.supervisorId) {
      alert("Please select a supervisor to proceed");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/students/complete-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          ...formData,
          supervisorId: formData.supervisorId,
        }),
      });

      const data = await response.json();

      if (data.error) {
        alert(data.error);
      } else {
        if (data.student) {
          setStudent(data.student);
        }
        setIsSubmitted(true);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to complete profile");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-primary/5">
        <div className="text-center text-primary">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="min-h-screen flex items-center justify-center bg-primary/5 px-4"
      >
        <div className="flex flex-col items-center justify-center text-center p-8 bg-white rounded-2xl shadow-lg border border-neutral/10 max-w-md w-full">
          <div className="h-24 w-24 rounded-full bg-success/10 flex items-center justify-center mb-6">
            <Check className="h-12 w-12 text-success" />
          </div>
          <h2 className="text-2xl font-bold text-primary mb-2">
            Profile Verified!
          </h2>
          <p className="text-neutral mb-6">
            Your details have been saved and verified. Welcome to your internship dashboard.
          </p>
          <Button
            className="w-full"
            onClick={() => {
              if (student?.id) {
                router.push(`/student/${student.id}`);
              } else {
                router.push("/login");
              }
            }}
          >
            Go to Dashboard
          </Button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="min-h-screen bg-primary/5 py-10 px-4">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="relative flex items-center justify-between w-full max-w-3xl mx-auto mb-12">
          <div className="absolute left-0 top-1/2 h-1 w-full bg-neutral/10 -z-10 rounded-full"></div>
          <div
            className="absolute left-0 top-1/2 h-1 bg-primary -z-10 rounded-full transition-all duration-500"
            style={{ width: `${((step - 1) / 2) * 100}%` }}
          ></div>

          {[
            { num: 1, label: "Personal Info", icon: User },
            { num: 2, label: "Company Info", icon: Building },
            { num: 3, label: "Supervisor", icon: Handshake },
          ].map((stage) => (
            <div
              key={stage.num}
              className="flex flex-col items-center gap-2 px-2"
            >
              <div
                className={cn(
                  "h-10 w-10 rounded-full flex items-center justify-center font-bold transition-all duration-300 border-2",
                  step >= stage.num
                    ? "bg-primary border-primary text-white shadow-lg shadow-primary/20"
                    : "bg-white border-neutral/20 text-neutral"
                )}
              >
                {step > stage.num ? <Check className="h-5 w-5" /> : stage.num}
              </div>
              <span
                className={cn(
                  "text-sm font-medium transition-colors duration-300",
                  step >= stage.num ? "text-primary" : "text-neutral"
                )}
              >
                {stage.label}
              </span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="hidden lg:flex lg:col-span-4 flex-col justify-center items-center text-center p-8 bg-primary/5 rounded-2xl border border-primary/10">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex flex-col items-center"
              >
                {step === 1 && (
                  <User className="h-48 w-48 text-primary/20 mb-6" strokeWidth={1} />
                )}
                {step === 2 && (
                  <Building className="h-48 w-48 text-primary/20 mb-6" strokeWidth={1} />
                )}
                {step === 3 && (
                  <Handshake className="h-48 w-48 text-primary/20 mb-6" strokeWidth={1} />
                )}

                <h3 className="text-xl font-bold text-primary mb-2">
                  {step === 1 && `Welcome, ${student?.user?.name}`}
                  {step === 2 && "Tell us about your company"}
                  {step === 3 && "Who is supervising you?"}
                </h3>
                <p className="text-neutral text-sm max-w-xs">
                  {step === 1 &&
                    "Confirm your personal details and optionally set a password for quick logins."}
                  {step === 2 &&
                    "Share the details of the organization hosting your internship."}
                  {step === 3 &&
                    "Select your supervisor from the list and provide internship schedule so we can keep them informed."}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="lg:col-span-8">
            <Card className="border-none shadow-xl">
              <CardContent className="p-8">
                <form onSubmit={handleSubmit}>
                  <AnimatePresence mode="wait">
                    {step === 1 && (
                      <motion.div
                        key="step1"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                      >
                        <div className="flex items-center gap-6 mb-8">
                          <div className="h-24 w-24 rounded-full bg-neutral/10 border-2 border-dashed border-primary/30 flex items-center justify-center">
                            <Upload className="h-8 w-8 text-neutral" />
                          </div>
                          <div>
                            <h4 className="font-medium text-neutral-dark">
                              Profile Photo
                            </h4>
                            <p className="text-xs text-neutral mt-1">
                              Photo uploads will arrive soon. Continue by filling in
                              your profile details.
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <Input
                            label="Password"
                            type="password"
                            value={formData.password}
                            onChange={(e) =>
                              setFormData({ ...formData, password: e.target.value })
                            }
                          />
                          <Input
                            label="Confirm Password"
                            type="password"
                            value={formData.confirmPassword}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                confirmPassword: e.target.value,
                              })
                            }
                          />
                          <Input
                            label="Phone Number *"
                            placeholder="+250 788 123 456"
                            value={formData.phone}
                            onChange={(e) =>
                              setFormData({ ...formData, phone: e.target.value })
                            }
                            required
                          />
                          <Input
                            label="Address *"
                            placeholder="Kigali, Rwanda"
                            value={formData.address}
                            onChange={(e) =>
                              setFormData({ ...formData, address: e.target.value })
                            }
                            required
                          />
                        </div>
                      </motion.div>
                    )}

                    {step === 2 && (
                      <motion.div
                        key="step2"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                      >
                        <Input
                          label="Company Name *"
                          placeholder="e.g. BK TechHouse"
                          value={formData.companyName}
                          onChange={(e) =>
                            setFormData({ ...formData, companyName: e.target.value })
                          }
                          required
                        />
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-primary">
                            Company Address *
                          </label>
                          <textarea
                            className="flex min-h-[120px] w-full rounded-lg border border-neutral/20 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary"
                            placeholder="Enter the full company address..."
                            value={formData.companyAddress}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                companyAddress: e.target.value,
                              })
                            }
                            required
                          ></textarea>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <Input
                            label="Company Phone"
                            placeholder="+250..."
                            value={formData.companyPhone}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                companyPhone: e.target.value,
                              })
                            }
                          />
                          <Input
                            label="Company Email"
                            type="email"
                            placeholder="info@company.com"
                            value={formData.companyEmail}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                companyEmail: e.target.value,
                              })
                            }
                          />
                        </div>
                      </motion.div>
                    )}

                    {step === 3 && (
                      <motion.div
                        key="step3"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                      >
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-primary">
                            Select Supervisor *
                          </label>
                          <select
                            className="w-full rounded-lg border border-neutral/20 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary"
                            value={formData.supervisorId}
                            onChange={(e) => handleSupervisorSelect(e.target.value)}
                            required
                          >
                            <option value="">Choose a supervisor</option>
                            {supervisors.map((sup) => (
                              <option key={sup.id} value={sup.id}>
                                {sup.user?.name} ({sup.user?.email})
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <Input
                            label="Internship Start Date *"
                            type="date"
                            value={formData.internshipStart}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                internshipStart: e.target.value,
                              })
                            }
                            required
                          />
                          <Input
                            label="Internship End Date *"
                            type="date"
                            value={formData.internshipEnd}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                internshipEnd: e.target.value,
                              })
                            }
                            required
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="flex justify-between mt-8 pt-6 border-t border-neutral/10">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={prevStep}
                      disabled={step === 1}
                      className={step === 1 ? "invisible" : ""}
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back
                    </Button>

                    {step < 3 ? (
                      <Button type="button" onClick={nextStep}>
                        Next Step
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    ) : (
                      <Button
                        type="submit" // Changed to submit for form validation
                        disabled={submitting}
                        className="bg-success hover:bg-success/90"
                      >
                        {submitting ? (
                          <>
                            <div className="h-4 w-4 mr-2 animate-spin rounded-full border-b-2 border-white"></div>
                            Saving...
                          </>
                        ) : (
                          <>
                            Complete & Verify Profile
                            <Check className="h-4 w-4 ml-2" />
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}