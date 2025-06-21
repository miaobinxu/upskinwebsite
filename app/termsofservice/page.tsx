export default function TermsAndConditionsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-[#393E46]">Terms & Conditions</h1>
        <p className="text-gray-600 text-sm mt-2">Effective as of June 2025</p>
      </div>

      <div className="bg-white shadow-sm border border-gray-200 rounded-2xl p-8 space-y-6 text-gray-700 leading-relaxed text-sm sm:text-base">
        <section>
          <p>
            Apps made available through the App Store are licensed, not sold, to you. Your license to each app is subject
            to your prior acceptance of either this Licensed Application End User License Agreement ("Standard EULA"), or
            a custom agreement ("Custom EULA") if provided by the Application Provider.
          </p>
          <p>
            Licensor reserves all rights not expressly granted to you under this Standard EULA.
          </p>
        </section>

        <section>
          <h3 className="font-semibold text-[#393E46]">a. Scope of License</h3>
          <p>
            The license is nontransferable and allows use only on Apple-branded devices you own or control, per Usage Rules.
            Redistribution, reverse-engineering, sublicensing, or modifying is prohibited unless allowed by law or licensing terms.
          </p>
        </section>

        <section>
          <h3 className="font-semibold text-[#393E46]">b. Consent to Use of Data</h3>
          <p>
            You consent that the Licensor may collect technical data (device type, OS, system software) to provide updates
            and support. This data does not personally identify you and is used to improve services.
          </p>
        </section>

        <section>
          <h3 className="font-semibold text-[#393E46]">c. Termination</h3>
          <p>
            This EULA remains effective until terminated by you or the Licensor. Violation of any terms leads to automatic termination.
          </p>
        </section>

        <section>
          <h3 className="font-semibold text-[#393E46]">d. External Services</h3>
          <p>
            The app may allow access to third-party services. Licensor is not responsible for their content or accuracy. Use at your own risk and comply with all laws and terms.
          </p>
        </section>

        <section>
          <h3 className="font-semibold text-[#393E46]">e. No Warranty</h3>
          <p>
            The app is provided "as is" without warranty. Licensor disclaims all warranties, including those of fitness,
            merchantability, or non-infringement. Some jurisdictions may not allow this exclusion.
          </p>
        </section>

        <section>
          <h3 className="font-semibold text-[#393E46]">f. Limitation of Liability</h3>
          <p>
            Licensor shall not be liable for any indirect, incidental, or consequential damages. Total liability will not exceed
            $50. Some regions may not allow such limitations.
          </p>
        </section>

        <section>
          <h3 className="font-semibold text-[#393E46]">g. Export Restrictions</h3>
          <p>
            You may not export the app into U.S.-embargoed countries or to individuals listed on government watchlists. You also
            agree not to use the app for nuclear, missile, or biological weapon development.
          </p>
        </section>

        <section>
          <h3 className="font-semibold text-[#393E46]">h. U.S. Government End Users</h3>
          <p>
            The app is licensed as a "Commercial Item" under applicable U.S. government regulations, with rights only as granted
            to all other users under this EULA.
          </p>
        </section>

        <section>
          <h3 className="font-semibold text-[#393E46]">i. Governing Law</h3>
          <p>
            This agreement is governed by California law unless you are outside the U.S., in which case your local laws and
            courts may apply.
          </p>
          <p>
            The United Nations Convention on the International Sale of Goods is excluded.
          </p>
        </section>
      </div>
    </div>
  )
}
