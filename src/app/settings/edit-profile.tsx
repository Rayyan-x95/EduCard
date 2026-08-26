import React, { useState } from "react";
import { View, ScrollView, TouchableOpacity, Alert } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Typography } from "@/components/ui/Typography";
import { TextInput } from "@/components/ui/TextInput";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { useAuthStore } from "@/stores/authStore";
import { AuthService } from "@/services/auth";
import { StorageService } from "@/services/storage";
import { COUNTRIES, countryName } from "@/lib/countries";
import { normalizeError } from "@/lib/errors";
import { AppHaptics } from "@/lib/haptics";
import { ArrowLeft, User, FileText, Camera, Globe } from "lucide-react-native";

export default function EditProfileScreen() {
  const router = useRouter();
  const { profile, setProfile, user } = useAuthStore();

  const [displayName, setDisplayName] = useState(profile?.display_name || "");
  const [bio, setBio] = useState(profile?.bio || "");
  // Country is user-editable post-onboarding (e.g. relocation). It feeds the
  // Campus feed filter so keeping it current matters.
  const [countryCode, setCountryCode] = useState(profile?.country_code || "");
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const handlePickAvatar = async () => {
    if (!user?.id) return;
    try {
      const localUri = await StorageService.pickImage({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });

      if (!localUri) return;

      setUploadingAvatar(true);
      const result = await StorageService.uploadAvatar(user.id, localUri);

      await AuthService.updateProfileSettings(user.id, {
        avatar_path: result.url,
      });
      if (profile) setProfile({ ...profile, avatar_path: result.url });
      Alert.alert("Photo Updated", "Your scholar profile photo has been updated.");
    } catch (err) {
      Alert.alert("Avatar Upload Failed", normalizeError(err).message);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSave = async () => {
    if (!user?.id) return;
    if (!displayName.trim()) {
      Alert.alert("Update Error", "Display name cannot be empty.");
      return;
    }
    if (displayName.trim().length > 80) {
      Alert.alert("Update Error", "Display name must be 80 characters or fewer.");
      return;
    }
    setLoading(true);

    try {
      const normalizedCountry =
        countryCode.trim().length === 2 ? countryCode.trim().toUpperCase() : null;
      await AuthService.updateProfileSettings(user.id, {
        display_name: displayName.trim(),
        bio: bio.trim() || null,
        country_code: normalizedCountry,
      });
      if (profile) {
        setProfile({
          ...profile,
          display_name: displayName.trim(),
          bio: bio.trim() || null,
          country_code: normalizedCountry,
        });
      }
      Alert.alert("Profile Updated", "Your academic credentials have been saved.", [
        { text: "OK", onPress: () => { if (router.canGoBack()) router.back(); else router.replace("/(tabs)" as any); } },
      ]);
    } catch (err) {
      Alert.alert("Update Error", normalizeError(err).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-surface">
      {/* Top App Bar */}
      <View className="px-5 py-3 border-b border-surface-container-high/80 flex-row items-center justify-between">
        <View className="flex-row items-center space-x-3">
          <TouchableOpacity
            onPress={() => {
              AppHaptics.light();
              if (router.canGoBack()) router.back(); else router.replace('/(tabs)' as any);
            }}
            className="w-10 h-10 rounded-xl bg-surface-container items-center justify-center border border-outline-variant/60 active:bg-surface-container-high"
          >
            <ArrowLeft size={20} color="#F8FAFC" />
          </TouchableOpacity>
          <Typography variant="label-lg" className="text-on-surface font-bold">
            Edit Profile
          </Typography>
        </View>

        <Button
          variant="primary"
          size="sm"
          loading={loading}
          onPress={handleSave}
          className="px-5 py-2"
        >
          Save
        </Button>
      </View>

      <ScrollView className="flex-1 px-5 py-6" keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Profile Photo Section with Role Ring Indicator */}
        <View className="items-center mb-8">
          <View className="relative">
            <Avatar
              name={profile?.display_name || "Scholar"}
              uri={profile?.avatar_path}
              size="xl"
              role={profile?.current_status || "undergraduate"}
              isVerified={profile?.is_verified}
              className="shadow-md"
            />
            <TouchableOpacity
              onPress={handlePickAvatar}
              disabled={uploadingAvatar}
              className="absolute bottom-0 right-0 w-9 h-9 rounded-full bg-primary border-2 border-surface items-center justify-center shadow-lg shadow-primary/30 active:opacity-80"
            >
              <Camera size={16} color="#0F172A" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={handlePickAvatar}
            disabled={uploadingAvatar}
            className="mt-3.5"
          >
            <Typography variant="label-md" className="text-primary font-bold normal-case">
              {uploadingAvatar ? "Uploading photo..." : "Change Profile Photo"}
            </Typography>
          </TouchableOpacity>
        </View>

        {/* Basic Information Bento Card */}
        <Card className="p-5 mb-5 bg-surface-container border border-outline-variant/60 shadow-sm">
          <View className="flex-row items-center space-x-2.5 pb-3.5 mb-4 border-b border-outline-variant/30">
            <View className="p-1.5 rounded-lg bg-primary-container/40 border border-primary/30">
              <User size={16} color="#818CF8" />
            </View>
            <Typography variant="headline-sm" className="text-on-surface font-bold">
              Scholar Information
            </Typography>
          </View>

          <TextInput
            label="Full Name / Display Name"
            value={displayName}
            onChangeText={setDisplayName}
            leftIcon={<User size={18} color="#818CF8" />}
          />

          <TextInput
            label="Academic Biography"
            placeholder="Share your research interests, coursework, or focus areas..."
            value={bio}
            onChangeText={setBio}
            multiline
            numberOfLines={4}
            maxLength={300}
            leftIcon={<FileText size={18} color="#818CF8" />}
            helperText={`${bio.length}/300 characters`}
          />

          {/* Country — user-editable post-onboarding (relocation etc.).
              Feeds the Campus feed filter, so keeping it current matters. */}
          <Typography variant="label-md" className="text-on-surface font-semibold mb-2">
            Country
          </Typography>
          <View className="flex-row flex-wrap gap-2 mb-3">
            {COUNTRIES.slice(0, 16).map((c) => (
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
                <Typography
                  variant="label-sm"
                  className={countryCode === c.code ? "text-primary font-bold" : "text-on-surface-variant"}
                >
                  {c.code}
                </Typography>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput
            label="Or type your 2-letter code"
            placeholder="e.g. US, UK, IN, PK"
            value={countryCode}
            onChangeText={(t) => setCountryCode(t.replace(/[^A-Za-z]/g, "").slice(0, 2).toUpperCase())}
            autoCapitalize="characters"
            leftIcon={<Globe size={18} color="#818CF8" />}
            helperText={
              countryCode.length === 2
                ? countryName(countryCode) !== countryCode
                  ? `Selected: ${countryName(countryCode)}`
                  : `"${countryCode}" is not a recognized ISO code — it will be cleared on save.`
                : "Optional. Powers your Campus feed."
            }
          />
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
