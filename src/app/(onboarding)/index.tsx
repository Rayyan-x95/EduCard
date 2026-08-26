import React, { useEffect, useState } from "react";
import { View, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { Typography } from "@/components/ui/Typography";
import { TextInput } from "@/components/ui/TextInput";
import { Button } from "@/components/ui/Button";
import { AuthService } from "@/services/auth";
import { TopicsService } from "@/services/topics";
import { queryKeys } from "@/lib/query-client";
import { useAuthStore } from "@/stores/authStore";
import { UserStatusEnum } from "@/types/database";
import { normalizeError } from "@/lib/errors";
import { Analytics } from "@/lib/analytics";
import { AppHaptics } from "@/lib/haptics";
import {
  COUNTRIES,
  isValidCountryCode,
  countryName,
} from "@/lib/countries";
import {
  USERNAME_RE,
  YEAR_MIN,
  YEAR_MAX,
  usernameHelperText,
  UsernameStatus,
} from "@/lib/onboarding";
import {
  School,
  Award,
  Briefcase,
  Sparkles,
  CheckCircle2,
  BookOpen,
  ArrowRight,
  Check,
} from "lucide-react-native";

interface RoleOption {
  id: UserStatusEnum;
  title: string;
  subtitle: string;
  icon: any;
}

const ROLES: RoleOption[] = [
  {
    id: "undergraduate",
    title: "Student",
    subtitle: "Currently enrolled in an academic program, seeking knowledge and guidance.",
    icon: School,
  },
  {
    id: "alumni",
    title: "Alumni",
    subtitle: "Graduated scholars looking to reconnect, share experiences, and network.",
    icon: Award,
  },
  {
    id: "professional",
    title: "Professional",
    subtitle: "Industry experts contributing insights and bridging academia and career.",
    icon: Briefcase,
  },
  {
    id: "mentor",
    title: "Mentor / Faculty",
    subtitle: "Experienced individuals dedicated to guiding and advising the next generation.",
    icon: Sparkles,
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { user, setProfile } = useAuthStore();
  const [step, setStep] = useState(1);

  const { data: availableTopics = [] } = useQuery({
    queryKey: queryKeys.topics(),
    queryFn: () => TopicsService.getTopics(),
  });

  // Form State
  const [selectedRole, setSelectedRole] = useState<UserStatusEnum>("undergraduate");
  const [username, setUsername] = useState("");
  const [institutionName, setInstitutionName] = useState("");
  const [field, setField] = useState("");
  const displayName = user?.user_metadata?.display_name || "";
  const [countryCode, setCountryCode] = useState("");
  const [degree, setDegree] = useState("");
  const [startYear, setStartYear] = useState("");
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Debounced username availability (only when format is valid)
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "taken" | "available">("idle");
  useEffect(() => {
    if (!USERNAME_RE.test(username.trim())) {
      setUsernameStatus("idle");
      return;
    }
    let cancelled = false;
    setUsernameStatus("checking");
    const t = setTimeout(async () => {
      try {
        const available = await AuthService.isUsernameAvailable(username.trim());
        if (!cancelled) setUsernameStatus(available ? "available" : "taken");
      } catch {
        if (!cancelled) setUsernameStatus("idle");
      }
    }, 500);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [username]);

  const toggleTopic = (id: string) => {
    AppHaptics.selection();
    if (selectedTopics.includes(id)) {
      setSelectedTopics(selectedTopics.filter((t) => t !== id));
    } else {
      setSelectedTopics([...selectedTopics, id]);
    }
  };

  /** Returns an error string, or "" when step 2 is valid. */
  const validateEducationStep = (): string => {
    if (!USERNAME_RE.test(username.trim())) {
      return "Username must be 3–24 characters using only lowercase letters, numbers, and underscores.";
    }
    if (!institutionName.trim()) return "Please enter your university or institution.";
    if (!field.trim()) return "Please enter your major or field of study.";
    if (!degree.trim()) return "Please enter your degree.";
    if (!isValidCountryCode(countryCode)) {
      return "Country must be a valid 2-letter code (e.g. US, UK, IN, PK).";
    }
    const year = parseInt(startYear, 10);
    if (!Number.isFinite(year) || year < YEAR_MIN || year > YEAR_MAX) {
      return `Start year must be between ${YEAR_MIN} and ${YEAR_MAX}.`;
    }
    return "";
  };

  const handleFinish = async () => {
    const validationError = validateEducationStep();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError("");
    setLoading(true);
    AppHaptics.light();

    try {
      await AuthService.completeOnboarding({
        username: username.toLowerCase().trim(),
        displayName: displayName.trim() || username.trim(),
        countryCode: countryCode.toUpperCase(),
        currentStatus: selectedRole,
        institutionName: institutionName.trim(),
        degree: degree.trim(),
        field: field.trim(),
        startYear: parseInt(startYear, 10),
        topicIds: selectedTopics,
      });

      if (user?.id) {
        const updatedProfile = await AuthService.getCurrentProfile(user.id);
        setProfile(updatedProfile);
      }
      Analytics.track("onboarding_completed", { role: selectedRole });
      AppHaptics.success();
      setStep(4); // Success step
    } catch (err) {
      AppHaptics.error();
      setError(normalizeError(err).message);
    } finally {
      setLoading(false);
    }
  };

  const usernameHelper = usernameHelperText(usernameStatus as UsernameStatus);

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
      <ScrollView className="flex-1 px-5 py-6" keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Step Progress Bar */}
        {step < 4 && (
          <View className="mb-8">
            <View className="flex-row items-center justify-between mb-2.5">
              <Typography variant="label-sm" className="text-on-surface-variant uppercase tracking-wider font-semibold">
                Step {step} of 3
              </Typography>
              <Typography variant="label-sm" className="text-primary font-bold normal-case">
                {step === 1 ? "Choose Your Path" : step === 2 ? "Education Profile" : "Academic Interests"}
              </Typography>
            </View>
            <View className="w-full h-1.5 bg-surface-container-high rounded-full overflow-hidden">
              <View
                className="h-full bg-primary rounded-full shadow-sm shadow-primary"
                style={{ width: `${(step / 3) * 100}%` }}
              />
            </View>
          </View>
        )}

        {error ? (
          <View className="bg-error-container/40 border border-error/50 rounded-xl p-3.5 mb-5 shadow-sm shadow-error/10">
            <Typography variant="label-sm" className="text-error font-semibold normal-case">
              {error}
            </Typography>
          </View>
        ) : null}

        {step === 1 && (
          /* Step 1: Choose Your Path */
          <View>
            <View className="items-center mb-6">
              <Typography variant="headline-lg" className="text-on-surface text-center mb-2 font-bold text-2xl">
                Choose Your Path
              </Typography>
              <Typography variant="body-md" className="text-on-surface-variant text-center max-w-xs leading-relaxed">
                Select the role that best describes you to personalize your EduCard experience.
              </Typography>
            </View>

            <View className="space-y-3 mb-8">
              {ROLES.map((r) => {
                const Icon = r.icon;
                const isSelected = selectedRole === r.id;
                return (
                  <TouchableOpacity
                    key={r.id}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: isSelected }}
                    accessibilityLabel={`Role: ${r.title}`}
                    onPress={() => {
                      AppHaptics.selection();
                      setSelectedRole(r.id);
                    }}
                    className={`p-4 rounded-2xl border ${
                      isSelected
                        ? "bg-primary-container/30 border-primary shadow-sm shadow-primary/20"
                        : "bg-surface-container border-outline-variant/60 active:bg-surface-container-high"
                    }`}
                  >
                    <View className="flex-row items-start space-x-3.5">
                      <View
                        className={`w-11 h-11 rounded-2xl items-center justify-center border-2 ${
                          isSelected ? "bg-primary-container/50 shadow-sm" : "bg-surface-container-high"
                        }`}
                      >
                        <Icon size={20} color={isSelected ? "#818CF8" : "#94A3B8"} />
                      </View>
                      <View className="flex-1">
                        <Typography variant="label-lg" className="text-on-surface font-bold mb-0.5">
                          {r.title}
                        </Typography>
                        <Typography variant="body-sm" className="text-on-surface-variant leading-relaxed">
                          {r.subtitle}
                        </Typography>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Button
              variant="primary"
              size="lg"
              onPress={() => {
                AppHaptics.light();
                setStep(2);
              }}
            >
              Continue to Education
            </Button>
          </View>
        )}

        {step === 2 && (
          /* Step 2: Education Profile */
          <View>
            <View className="items-center mb-6">
              <Typography variant="headline-lg" className="text-on-surface text-center mb-2 font-bold text-2xl">
                Academic Profile
              </Typography>
              <Typography variant="body-md" className="text-on-surface-variant text-center max-w-xs leading-relaxed">
                Tell us where you study so we can route questions to relevant scholars.
              </Typography>
            </View>

            <TextInput
              label="Scholar Handle / Username"
              placeholder="e.g. sarahchen"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
              error={usernameStatus === "taken" ? "That username is taken." : undefined}
              helperText={usernameHelper}
            />

            <TextInput
              label="University or Institution"
              placeholder="e.g. Stanford University, UC Berkeley, Oxford"
              value={institutionName}
              onChangeText={setInstitutionName}
              leftIcon={<School size={18} color="#818CF8" />}
            />

            <TextInput
              label="Major or Field of Study"
              placeholder="e.g. Computer Science, Mechanical Engineering"
              value={field}
              onChangeText={setField}
              leftIcon={<BookOpen size={18} color="#818CF8" />}
            />

            <TextInput
              label="Degree"
              placeholder="e.g. B.S., M.A., Ph.D., Diploma"
              value={degree}
              onChangeText={setDegree}
            />

            <Typography variant="label-md" className="text-on-surface font-semibold mb-2">
              Country
            </Typography>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="mb-4"
              contentContainerStyle={{ gap: 8, paddingRight: 16 }}
            >
              {COUNTRIES.slice(0, 20).map((c) => (
                <TouchableOpacity
                  key={c.code}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: countryCode === c.code }}
                  onPress={() => {
                    AppHaptics.selection();
                    setCountryCode(c.code);
                  }}
                  className={`px-3 py-1.5 rounded-full border ${
                    countryCode === c.code
                      ? "bg-primary-container/40 border-primary"
                      : "bg-surface-container border-outline-variant/60 active:bg-surface-container-high"
                  }`}
                >
                  <Typography variant="label-sm" className={countryCode === c.code ? "text-primary font-bold" : "text-on-surface-variant"}>
                    {c.code}
                  </Typography>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TextInput
              label="Or type your 2-letter country code"
              placeholder="e.g. US, UK, IN, PK, NG"
              value={countryCode}
              onChangeText={(t) => setCountryCode(t.replace(/[^A-Za-z]/g, "").slice(0, 2).toUpperCase())}
              autoCapitalize="characters"
              error={
                countryCode.length === 2 && !isValidCountryCode(countryCode)
                  ? `"${countryCode}" is not a recognized ISO code.`
                  : undefined
              }
              helperText={
                countryCode && isValidCountryCode(countryCode)
                  ? `Selected: ${countryName(countryCode)}`
                  : "Your ISO 3166-1 alpha-2 code."
              }
            />

            <TextInput
              label="Start Year"
              placeholder={`e.g. ${new Date().getFullYear()}`}
              value={startYear}
              onChangeText={(t) => setStartYear(t.replace(/[^0-9]/g, "").slice(0, 4))}
              keyboardType="number-pad"
              helperText={`Between ${YEAR_MIN} and ${YEAR_MAX}.`}
            />

            <Button
              variant="primary"
              size="lg"
              onPress={() => {
                const validationError = validateEducationStep();
                if (validationError) {
                  setError(validationError);
                  return;
                }
                if (usernameStatus === "taken") {
                  setError("That username is already taken. Please choose another.");
                  return;
                }
                // Don't advance while availability is still resolving — a
                // conflict discovered at final submit would cost the user
                // the whole form.
                if (usernameStatus === "checking") {
                  setError("Checking username availability — one moment…");
                  return;
                }
                setError("");
                AppHaptics.light();
                setStep(3);
              }}
              className="mt-4 mb-3"
            >
              Continue to Interests
            </Button>

            <Button
              variant="ghost"
              size="md"
              onPress={() => {
                AppHaptics.light();
                setStep(1);
              }}
            >
              Back
            </Button>
          </View>
        )}

        {step === 3 && (
          /* Step 3: Academic Interests */
          <View>
            <View className="items-center mb-6">
              <Typography variant="headline-lg" className="text-on-surface text-center mb-2 font-bold text-2xl">
                Academic Interests
              </Typography>
              <Typography variant="body-md" className="text-on-surface-variant text-center max-w-xs leading-relaxed">
                Optionally pick topics you care about — you can change these anytime.
              </Typography>
            </View>

            {availableTopics.length > 0 ? (
              <View className="flex-row flex-wrap gap-2.5 mb-8">
                {availableTopics.map((topic: any) => {
                  const isSelected = selectedTopics.includes(topic.id);
                  return (
                    <TouchableOpacity
                      key={topic.id}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: isSelected }}
                      onPress={() => toggleTopic(topic.id)}
                      className={`flex-row items-center px-4 py-2.5 rounded-full border ${
                        isSelected
                          ? "bg-primary-container/60 border-primary shadow-sm shadow-primary/20"
                          : "bg-surface-container border-outline-variant/60 active:bg-surface-container-high"
                      }`}
                    >
                      {isSelected && (
                        <View className="mr-1.5">
                          <Check size={14} color="#818CF8" strokeWidth={2.6} />
                        </View>
                      )}
                      <Typography
                        variant="label-sm"
                        className={isSelected ? "text-primary font-bold normal-case" : "text-on-surface-variant font-medium normal-case"}
                      >
                        {topic.name}
                      </Typography>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
              <Typography variant="body-md" className="text-on-surface-variant text-center mb-8 normal-case">
                Topic catalog is loading or unavailable — you can skip this step.
              </Typography>
            )}

            <Button
              variant="primary"
              size="lg"
              loading={loading}
              onPress={handleFinish}
              className="mb-3"
            >
              Complete Setup
            </Button>

            <Button
              variant="ghost"
              size="md"
              onPress={() => {
                AppHaptics.light();
                setStep(2);
              }}
            >
              Back
            </Button>
          </View>
        )}

        {step === 4 && (
          /* Step 4: Your EduCard is Ready */
          <View className="items-center text-center py-10">
            <View className="w-28 h-28 rounded-3xl bg-tertiary-container/30 border-2 border-tertiary/60 items-center justify-center mb-8 shadow-xl shadow-tertiary/20">
              <CheckCircle2 size={56} color="#34D399" />
            </View>

            <Typography variant="headline-lg" className="text-on-surface text-center mb-3 font-extrabold text-3xl">
              Your EduCard is Ready!
            </Typography>

            <Typography variant="body-md" className="text-on-surface-variant text-center max-w-sm mb-10 leading-relaxed">
              Your academic profile has been successfully configured. You are now ready to join discussions, connect with peers, and share knowledge.
            </Typography>

            <Button
              variant="primary"
              size="lg"
              rightIcon={<ArrowRight size={18} color="#0F172A" />}
              onPress={() => {
                AppHaptics.medium();
                router.replace("/(tabs)" as any);
              }}
              className="w-full"
            >
              Go to Feed
            </Button>
          </View>
        )}
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
