import Link from "next/link";

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-[#393E46]">Privacy Policy</h1>
        <p className="text-gray-600 text-sm mt-2">Effective as of June 2025</p>
      </div>

      <div className="bg-white shadow-sm border border-gray-200 rounded-2xl p-8 space-y-8 text-gray-700 leading-relaxed text-sm sm:text-base">
        <section>
          <h2 className="text-lg font-semibold text-[#6D9886] mb-2">Welcome to UpSkin App</h2>
          <p>
            This page informs visitors of our policies regarding the collection, use, and disclosure of Personal
            Information if you use our Service. By using the Service, you agree to the collection and use of
            information in accordance with this policy. Terms used here have the same meaning as in our Terms and
            Conditions unless otherwise defined.
          </p>
        </section>

        <section>
          <h3 className="text-base font-semibold text-[#393E46] mb-2">Information We Collect</h3>
          <p>
            We collect images that you upload to our app for the purpose of generating analysis reports.
          </p>
        </section>

        <section>
          <h3 className="text-base font-semibold text-[#393E46] mb-2">How We Use Your Information</h3>
          <p>
            Uploaded images are solely used to provide your requested analysis report. We do not train AI models
            using your data. Your images are not used for any other purpose.
          </p>
        </section>

        <section>
          <h3 className="text-base font-semibold text-[#393E46] mb-2">Your Rights</h3>
          <p>
            You can delete your account and all associated data directly from the Settings section of the app.
          </p>
        </section>

        <section>
          <h3 className="text-base font-semibold text-[#393E46] mb-2">Data Retention</h3>
          <p>
            Uploaded images are automatically deleted after service completion. We do not store them on our servers.
          </p>
        </section>

        <section>
          <h3 className="text-base font-semibold text-[#393E46] mb-2">Facial Image Data</h3>
          <p>
            Facial images are used strictly for acne and pore analysis. They are processed securely and temporarily,
            then discarded. We do not store biometric identifiers or use images for advertising, profiling, or
            third-party sharing.
          </p>
          <p className="mt-2">
            Images remain on your device for up to 7 days to allow result review. They are never uploaded to or shared
            from our servers post-analysis.
          </p>
        </section>

        <section>
          <h3 className="text-base font-semibold text-[#393E46] mb-2">Changes to This Policy</h3>
          <p>
            We may update this policy at any time. Any changes will be posted here and take effect immediately.
          </p>
        </section>

        <section>
          <h3 className="text-base font-semibold text-[#393E46] mb-2">Contact Us</h3>
          <p>
            If you have any questions, contact us at{" "}
            <Link
              href="mailto:nativfeedback@gmail.com"
              className="text-[#6D9886] underline hover:text-[#518c74]"
            >
              nativfeedback@gmail.com
            </Link>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
