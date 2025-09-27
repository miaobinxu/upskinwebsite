"use client";

export default function HomePage() {
  return (
    <>
      <style jsx>{`
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          margin: 0;
          padding: 0;
          line-height: 1.7;
          color: #393e46;
          background: linear-gradient(135deg, #f7f7f7 0%, #f2e7d5 100%);
          min-height: 100vh;
        }
        
        .app-store-section {
          text-align: center;
          margin: 60px 0;
        }
        
        .app-store-button {
          display: inline-block;
          padding: 18px 40px;
          background: linear-gradient(135deg, #6d9886 0%, #5a8070 100%);
          color: white;
          border-radius: 12px;
          text-decoration: none;
          font-size: 18px;
          font-weight: 600;
          letter-spacing: 0.5px;
          box-shadow: 0 8px 25px rgba(109, 152, 134, 0.3);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          border: none;
          position: relative;
          overflow: hidden;
        }

        .app-store-button::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
          transition: left 0.5s;
        }

        .app-store-button:hover::before {
          left: 100%;
        }

        .app-store-button:hover, .app-store-button:focus {
          background: linear-gradient(135deg, #5a8070 0%, #4a6b5a 100%);
          text-decoration: none;
          color: white;
          transform: translateY(-3px);
          box-shadow: 0 12px 35px rgba(109, 152, 134, 0.4);
        }
        
        .container {
          width: 90%;
          max-width: 1200px;
          margin: auto;
          overflow: hidden;
        }
        
        header {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          color: #393e46;
          padding: 20px 0;
          border-bottom: 1px solid rgba(109, 152, 134, 0.2);
          box-shadow: 0 2px 20px rgba(0, 0, 0, 0.1);
          position: sticky;
          top: 0;
          z-index: 100;
        }
        
        header a {
          color: #393e46;
          text-decoration: none;
          font-weight: 500;
          font-size: 15px;
          transition: all 0.3s ease;
        }
        
        header ul {
          padding: 0;
          list-style: none;
          text-align: center;
          margin: 0;
        }
        
        header li {
          display: inline;
          margin: 0 25px;
        }
        
        header #branding {
          float: left;
        }
        
        header #branding h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 700;
          background: linear-gradient(135deg, #6d9886 0%, #5a8070 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        header nav {
          float: right;
          margin-top: 8px;
        }
        
        header .highlight {
          font-weight: 800;
        }
        
        header .current a {
          background: linear-gradient(135deg, #6d9886 0%, #5a8070 100%);
          color: white;
          padding: 10px 20px;
          border-radius: 8px;
          font-weight: 600;
          transition: all 0.3s ease;
        }
        
        header a:hover {
          color: #6d9886;
          transform: translateY(-1px);
        }
        
        header .current a:hover {
          color: white;
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(109, 152, 134, 0.3);
        }
        
        .main-title {
          text-align: center;
          margin: 80px 0 40px 0;
          font-size: 48px;
          font-weight: 800;
          background: linear-gradient(135deg, #393e46 0%, #6d9886 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          line-height: 1.2;
        }
        
        .section {
          margin: 50px 0;
          padding: 40px;
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(10px);
          border-radius: 20px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          transition: all 0.3s ease;
        }
        
        .section:hover {
          transform: translateY(-2px);
          box-shadow: 0 15px 40px rgba(0, 0, 0, 0.15);
        }
        
        .section h2 {
          color: #393e46;
          font-size: 32px;
          font-weight: 700;
          margin-bottom: 25px;
          padding-bottom: 15px;
          border-bottom: 3px solid #6d9886;
          display: inline-block;
        }
        
        .section h3 {
          color: #6d9886;
          font-size: 22px;
          font-weight: 600;
          margin: 30px 0 15px 0;
        }
        
        .section p {
          font-size: 16px;
          line-height: 1.8;
          margin-bottom: 20px;
          color: #393e46;
        }
        
        .section ul {
          padding-left: 25px;
          margin: 20px 0;
        }
        
        .section li {
          margin-bottom: 8px;
          color: #393e46;
          line-height: 1.6;
        }
        
        .section a {
          color: #6d9886;
          text-decoration: none;
          font-weight: 500;
          transition: all 0.3s ease;
        }
        
        .section a:hover {
          color: #5a8070;
          text-decoration: underline;
        }
        
        footer {
          background: linear-gradient(135deg, #393e46 0%, #2a2f36 100%);
          color: white;
          text-align: center;
          padding: 50px 0;
          margin-top: 80px;
          font-size: 16px;
          font-weight: 500;
        }
        
        /* Responsive Design */
        @media (max-width: 768px) {
          header #branding, header nav {
            float: none;
            text-align: center;
          }
          
          header nav {
            margin-top: 20px;
          }
          
          header li {
            display: block;
            margin: 10px 0;
          }
          
          .main-title {
            font-size: 36px;
            margin: 60px 0 30px 0;
          }
          
          .section {
            padding: 30px 20px;
            margin: 30px 0;
          }
          
          .container {
            width: 95%;
          }
        }
        
        /* Smooth scrolling */
        html {
          scroll-behavior: smooth;
        }
        
        /* Custom scrollbar */
        ::-webkit-scrollbar {
          width: 8px;
        }
        
        ::-webkit-scrollbar-track {
          background: #f1f1f1;
        }
        
        ::-webkit-scrollbar-thumb {
          background: #6d9886;
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: #5a8070;
        }
      `}</style>
      
      <header>
        <div className="container">
          <div id="branding">
            <h1><span className="highlight">CharmChat</span> App</h1>
          </div>
          <nav>
            <ul>
              <li><a href="#privacy">Privacy Policy</a></li>
              <li><a href="#terms">Terms</a></li>
              <li className="current"><a href="https://apps.apple.com/us/app/nativechat-texting-natively/id6463583958">Download</a></li>
            </ul>
          </nav>
        </div>
      </header>
      
      <div className="container">
        <h1 className="main-title">Welcome to CharmChat</h1>
        <div className="app-store-section">
          <a href="https://apps.apple.com/us/app/nativechat-texting-natively/id6463583958" target="_blank" className="app-store-button">Download on the App Store</a>
        </div>
        
        <div className="section" id="privacy">
          <h2>Privacy Policy</h2>
          <p>
            This page is used to inform visitors regarding my policies with the collection, use, and disclosure of
            Personal Information if anyone decided to use my Service. If you choose to use my Service, then you agree
            to the collection and use of information in relation to this policy. The Personal Information that I
            collect is used for providing and improving the Service. I will not use or share your information with
            anyone except as described in this Privacy Policy. The terms used in this Privacy Policy have the same
            meanings as in our Terms and Conditions, which are accessible at CharmChat App unless otherwise defined in
            this Privacy Policy.
          </p>
          <h3>Information Collection and Use</h3>
          <p>
            For a better experience, while using our Service, I may require you to provide us with certain personally
            identifiable information, including but not limited to Usage Data. The information that I request will be
            retained on your device and is not collected by me in any way.
          </p>
          <h3>Log Data</h3>
          <p>
            I want to inform you that whenever you use my Service, in a case of an error in the app I collect data and
            information (through third-party products) on your phone called Log Data. This Log Data may include
            information such as your device Internet Protocol (&quot;IP&quot;) address, device name, operating system version,
            the configuration of the app when utilizing my Service, the time and date of your use of the Service, and
            other statistics.
          </p>
          <h3>Cookies</h3>
          <p>Cookies are files with a small amount of data that are commonly used as anonymous unique identifiers. These are sent to your browser from the websites that you visit and are stored on your device&apos;s internal memory. This Service does not use these &quot;cookies&quot; explicitly. However, the app may use third-party code and libraries that use &quot;cookies&quot; to collect information and improve their services. You have the option to either accept or refuse these cookies and know when a cookie is being sent to your device. If you choose to refuse our cookies, you may not be able to use some portions of this Service.</p>
          <h3>Service Providers</h3>
          <p>
            I may employ third-party companies and individuals due to the following reasons:
          </p>
          <ul>
            <li>To facilitate our Service;</li>
            <li>To provide the Service on our behalf;</li>
            <li>To perform Service-related services; or</li>
            <li>To assist us in analyzing how our Service is used.</li>
          </ul>
          <p>
            I want to inform users of this Service that these third parties have access to their Personal Information.
            The reason is to perform the tasks assigned to them on our behalf. However, they are obligated not to
            disclose or use the information for any other purpose.
          </p>
          <h3>Security</h3>
          <p>
            I value your trust in providing us your Personal Information, thus we are striving to use commercially
            acceptable means of protecting it. But remember that no method of transmission over the internet, or method
            of electronic storage is 100% secure and reliable, and I cannot guarantee its absolute security.
          </p>
          <h3>Links to Other Sites</h3>
          <p>
            This Service may contain links to other sites. If you click on a third-party link, you will be directed to
            that site. Note that these external sites are not operated by me. Therefore, I strongly advise you to
            review the Privacy Policy of these websites. I have no control over and assume no responsibility for the
            content, privacy policies, or practices of any third-party sites or services.
          </p>
          <h3>Children&apos;s Privacy</h3>
          <p>
            These Services do not address anyone under the age of 13. I do not knowingly collect personally
            identifiable information from children under 13 years of age. In the case I discover that a child under 13
            has provided me with personal information, I immediately delete this from our servers. If you are a parent
            or guardian and you are aware that your child has provided us with personal information, please contact me
            so that I will be able to do the necessary actions.
          </p>
          <h3>Changes to This Privacy Policy</h3>
          <p>
            I may update our Privacy Policy from time to time. Thus, you are advised to review this page periodically
            for any changes. I will notify you of any changes by posting the new Privacy Policy on this page. This
            policy is effective as of 2022-12-06
          </p>
          <h3>Contact Us</h3>
          <p>
            If you have any questions or suggestions about my Privacy Policy, do not hesitate to contact us at{' '}
            <a href="mailto:nativfeedback@gmail.com">nativfeedback@gmail.com</a>.
          </p>
        </div>
        
        <div className="section" id="terms">
          <h2>Terms and Conditions</h2>
          <p>Apps made available through the App Store are licensed, not sold, to you. Your license to each App is subject to your prior acceptance of either this Licensed Application End User License Agreement (&quot;Standard EULA&quot;), or a custom end user license agreement between you and the Application Provider (&quot;Custom EULA&quot;), if one is provided. Your license to any Apple App under this Standard EULA or Custom EULA is granted by Apple, and your license to any Third Party App under this Standard EULA or Custom EULA is granted by the Application Provider of that Third Party App. Any App that is subject to this Standard EULA is referred to herein as the &quot;Licensed Application.&quot; The Application Provider or Apple as applicable (&quot;Licensor&quot;) reserves all rights in and to the Licensed Application not expressly granted to you under this Standard EULA.</p>

          <p>a. Scope of License: Licensor grants to you a nontransferable license to use the Licensed Application on any Apple-branded products that you own or control and as permitted by the Usage Rules. The terms of this Standard EULA will govern any content, materials, or services accessible from or purchased within the Licensed Application as well as upgrades provided by Licensor that replace or supplement the original Licensed Application, unless such upgrade is accompanied by a Custom EULA. Except as provided in the Usage Rules, you may not distribute or make the Licensed Application available over a network where it could be used by multiple devices at the same time. You may not transfer, redistribute or sublicense the Licensed Application and, if you sell your Apple Device to a third party, you must remove the Licensed Application from the Apple Device before doing so. You may not copy (except as permitted by this license and the Usage Rules), reverse-engineer, disassemble, attempt to derive the source code of, modify, or create derivative works of the Licensed Application, any updates, or any part thereof (except as and only to the extent that any foregoing restriction is prohibited by applicable law or to the extent as may be permitted by the licensing terms governing use of any open-sourced components included with the Licensed Application).</p>

          <p>b. Consent to Use of Data: You agree that Licensor may collect and use technical data and related information—including but not limited to technical information about your device, system and application software, and peripherals—that is gathered periodically to facilitate the provision of software updates, product support, and other services to you (if any) related to the Licensed Application. Licensor may use this information, as long as it is in a form that does not personally identify you, to improve its products or to provide services or technologies to you.</p>

          <p>c. Termination. This Standard EULA is effective until terminated by you or Licensor. Your rights under this Standard EULA will terminate automatically if you fail to comply with any of its terms. </p>
          <p>d. External Services. The Licensed Application may enable access to Licensor&apos;s and/or third-party services and websites (collectively and individually, &quot;External Services&quot;). You agree to use the External Services at your sole risk. Licensor is not responsible for examining or evaluating the content or accuracy of any third-party External Services, and shall not be liable for any such third-party External Services. Data displayed by any Licensed Application or External Service, including but not limited to financial, medical and location information, is for general informational purposes only and is not guaranteed by Licensor or its agents. You will not use the External Services in any manner that is inconsistent with the terms of this Standard EULA or that infringes the intellectual property rights of Licensor or any third party. You agree not to use the External Services to harass, abuse, stalk, threaten or defame any person or entity, and that Licensor is not responsible for any such use. External Services may not be available in all languages or in your Home Country, and may not be appropriate or available for use in any particular location. To the extent you choose to use such External Services, you are solely responsible for compliance with any applicable laws. Licensor reserves the right to change, suspend, remove, disable or impose access restrictions or limits on any External Services at any time without notice or liability to you. </p>

          <p>e. NO WARRANTY: YOU EXPRESSLY ACKNOWLEDGE AND AGREE THAT USE OF THE LICENSED APPLICATION IS AT YOUR SOLE RISK. TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, THE LICENSED APPLICATION AND ANY SERVICES PERFORMED OR PROVIDED BY THE LICENSED APPLICATION ARE PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE,&quot; WITH ALL FAULTS AND WITHOUT WARRANTY OF ANY KIND, AND LICENSOR HEREBY DISCLAIMS ALL WARRANTIES AND CONDITIONS WITH RESPECT TO THE LICENSED APPLICATION AND ANY SERVICES, EITHER EXPRESS, IMPLIED, OR STATUTORY, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES AND/OR CONDITIONS OF MERCHANTABILITY, OF SATISFACTORY QUALITY, OF FITNESS FOR A PARTICULAR PURPOSE, OF ACCURACY, OF QUIET ENJOYMENT, AND OF NONINFRINGEMENT OF THIRD-PARTY RIGHTS. NO ORAL OR WRITTEN INFORMATION OR ADVICE GIVEN BY LICENSOR OR ITS AUTHORIZED REPRESENTATIVE SHALL CREATE A WARRANTY. SHOULD THE LICENSED APPLICATION OR SERVICES PROVE DEFECTIVE, YOU ASSUME THE ENTIRE COST OF ALL NECESSARY SERVICING, REPAIR, OR CORRECTION. SOME JURISDICTIONS DO NOT ALLOW THE EXCLUSION OF IMPLIED WARRANTIES OR LIMITATIONS ON APPLICABLE STATUTORY RIGHTS OF A CONSUMER, SO THE ABOVE EXCLUSION AND LIMITATIONS MAY NOT APPLY TO YOU.</p>

          <p>f. Limitation of Liability. TO THE EXTENT NOT PROHIBITED BY LAW, IN NO EVENT SHALL LICENSOR BE LIABLE FOR PERSONAL INJURY OR ANY INCIDENTAL, SPECIAL, INDIRECT, OR CONSEQUENTIAL DAMAGES WHATSOEVER, INCLUDING, WITHOUT LIMITATION, DAMAGES FOR LOSS OF PROFITS, LOSS OF DATA, BUSINESS INTERRUPTION, OR ANY OTHER COMMERCIAL DAMAGES OR LOSSES, ARISING OUT OF OR RELATED TO YOUR USE OF OR INABILITY TO USE THE LICENSED APPLICATION, HOWEVER CAUSED, REGARDLESS OF THE THEORY OF LIABILITY (CONTRACT, TORT, OR OTHERWISE) AND EVEN IF LICENSOR HAS BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES. SOME JURISDICTIONS DO NOT ALLOW THE LIMITATION OF LIABILITY FOR PERSONAL INJURY, OR OF INCIDENTAL OR CONSEQUENTIAL DAMAGES, SO THIS LIMITATION MAY NOT APPLY TO YOU. In no event shall Licensor&apos;s total liability to you for all damages (other than as may be required by applicable law in cases involving personal injury) exceed the amount of fifty dollars ($50.00). The foregoing limitations will apply even if the above stated remedy fails of its essential purpose.</p>

          <p>g. You may not use or otherwise export or re-export the Licensed Application except as authorized by United States law and the laws of the jurisdiction in which the Licensed Application was obtained. In particular, but without limitation, the Licensed Application may not be exported or re-exported (a) into any U.S.-embargoed countries or (b) to anyone on the U.S. Treasury Department&apos;s Specially Designated Nationals List or the U.S. Department of Commerce Denied Persons List or Entity List. By using the Licensed Application, you represent and warrant that you are not located in any such country or on any such list. You also agree that you will not use these products for any purposes prohibited by United States law, including, without limitation, the development, design, manufacture, or production of nuclear, missile, or chemical or biological weapons.</p>

          <p>h. The Licensed Application and related documentation are &quot;Commercial Items&quot;, as that term is defined at 48 C.F.R. §2.101, consisting of &quot;Commercial Computer Software&quot; and &quot;Commercial Computer Software Documentation&quot;, as such terms are used in 48 C.F.R. §12.212 or 48 C.F.R. §227.7202, as applicable. Consistent with 48 C.F.R. §12.212 or 48 C.F.R. §227.7202-1 through 227.7202-4, as applicable, the Commercial Computer Software and Commercial Computer Software Documentation are being licensed to U.S. Government end users (a) only as Commercial Items and (b) with only those rights as are granted to all other end users pursuant to the terms and conditions herein. Unpublished-rights reserved under the copyright laws of the United States.</p>

          <p>i. Except to the extent expressly provided in the following paragraph, this Agreement and the relationship between you and Apple shall be governed by the laws of the State of California, excluding its conflicts of law provisions. You and Apple agree to submit to the personal and exclusive jurisdiction of the courts located within the county of Santa Clara, California, to resolve any dispute or claim arising from this Agreement. If (a) you are not a U.S. citizen; (b) you do not reside in the U.S.; (c) you are not accessing the Service from the U.S.; and (d) you are a citizen of one of the countries identified below, you hereby agree that any dispute or claim arising from this Agreement shall be governed by the applicable law set forth below, without regard to any conflict of law provisions, and you hereby irrevocably submit to the non-exclusive jurisdiction of the courts located in the state, province or country identified below whose law governs:</p>

          <p>If you are a citizen of any European Union country or Switzerland, Norway or Iceland, the governing law and forum shall be the laws and courts of your usual place of residence.</p>

          <p>Specifically excluded from application to this Agreement is that law known as the United Nations Convention on the International Sale of Goods.</p>
        </div>
      </div>

      <footer>
        <p>&copy; 2024 CharmChat App, All Rights Reserved</p>
      </footer>
    </>
  )
}
