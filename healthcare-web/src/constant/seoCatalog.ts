export interface SeoFaqItem {
  q: string;
  a: string;
}

export interface SeoServiceSpec {
  slug: string;
  code: string;
  name: string;
  shortName: string;
  headline: string;
  metaDescription: string;
  startingPricePkr: number;
  priceLabel: string;
  slaMinutes: string;
  councilBadge: string;
  overview: string;
  clinicalHighlights: string[];
  includedItems: string[];
  idealFor: string[];
  faqs: SeoFaqItem[];
}

export interface SeoCitySpec {
  slug: string;
  name: string;
  province: string;
  isPrimaryHub: boolean;
  etaRange: string;
  helpline: string;
  coordinates: {
    lat: string;
    lng: string;
  };
  zones: string[];
  localHospitals: string[];
  description: string;
}

export const SITE_BASE_URL = 'https://homehealth.pk';

export const SEO_SERVICES: SeoServiceSpec[] = [
  {
    slug: 'nursing',
    code: 'NURSING',
    name: 'Home Nursing Care Services',
    shortName: 'Home Nursing',
    headline: 'PNC-Registered Home Nursing Care at Your Doorstep',
    metaDescription:
      'Book PNC-licensed male & female home nurses for post-surgical wound dressing, IV cannula & drip administration, injections, catheter care, and vital signs monitoring.',
    startingPricePkr: 1500,
    priceLabel: 'From PKR 1,500 / visit',
    slaMinutes: '45–60 mins',
    councilBadge: 'PNC Licensed Nurses',
    overview:
      'Our hospital-trained, Pakistan Nursing Council (PNC) registered nurses deliver safe, sterile clinical procedures in the comfort of your home. Whether your loved one needs post-operative surgical dressing, intravenous therapy, NG tube feeding, or ICU-level vitals monitoring, we bring sterile single-use kits directly to your bedside.',
    clinicalHighlights: [
      '100% PNC-verified male and female registered nurses (BSN / RN)',
      'Post-surgical sterile wound dressing & diabetic foot ulcer management',
      'IV cannulation, infusion drips, IM/IV/SC injections & antibiotic administration',
      'Foley catheterization, NG tube insertion/feeding & tracheostomy care',
      'Complete vital signs check (BP, Blood Glucose, SpO2, Pulse, Temperature)',
    ],
    includedItems: [
      'Sealed single-use sterile dressing or injection kit',
      'Digital vital signs assessment & clinical chart note',
      'Infection control PPE (surgical gloves, mask, sanitizer)',
      'Digital visit summary uploaded to your family portal',
    ],
    idealFor: [
      'Post-operative patients recovering after orthopedic, cardiac, or abdominal surgery',
      'Elderly parents requiring routine injections, IV hydration, or bed-sore care',
      'Diabetic & hypertensive patients needing daily clinical monitoring',
    ],
    faqs: [
      {
        q: 'Are your home nurses registered with the Pakistan Nursing Council (PNC)?',
        a: 'Yes. Every nurse on HomeHealth undergoes strict PNC license verification, CNIC verification, practical clinical assessment, and police background clearance before being assigned to home visits.',
      },
      {
        q: 'Can I request a female nurse for a female patient?',
        a: 'Absolutely. During booking you can specify your preferred practitioner gender (Male or Female nurse) so your family feels completely comfortable.',
      },
      {
        q: 'Do nurses bring their own medical supplies and sterile kits?',
        a: 'Yes, our nurses carry a calibrated diagnostic kit (BP apparatus, glucometer, pulse oximeter, thermometer) and sterile disposable consumables for standard procedures.',
      },
    ],
  },
  {
    slug: 'visiting-doctor',
    code: 'VISITING_DOCTOR',
    name: 'Visiting Doctor at Home',
    shortName: 'Visiting Doctor',
    headline: 'PMDC-Certified Doctors for In-Home Medical Consultations',
    metaDescription:
      'Schedule a PMDC-registered general physician or specialist for a thorough home medical checkup, acute illness diagnosis, chronic disease management, and digital prescription.',
    startingPricePkr: 2500,
    priceLabel: 'From PKR 2,500 / visit',
    slaMinutes: '45–60 mins',
    councilBadge: 'PMDC Verified Physicians',
    overview:
      'Skip crowded hospital OPDs and waiting rooms. Our PMDC-licensed MBBS & FCPS physicians visit your home to perform a comprehensive physical examination, review patient history and medications, diagnose acute or chronic conditions, and issue a complete digital treatment plan.',
    clinicalHighlights: [
      'PMDC-registered MBBS General Physicians & FCPS Medical Specialists',
      '30–45 minute unhurried bedside clinical consultation and physical exam',
      'Complete geriatric health evaluation & chronic medication reconciliation',
      'Immediate digital prescription & lab test recommendations',
      'Free post-visit follow-up review once lab reports arrive',
    ],
    includedItems: [
      'Full systemic examination (Chest auscultation, ENT, abdominal & neurological check)',
      'Vitals screening (BP, SpO2, Random Blood Sugar, Temperature)',
      'Official digital prescription with dosage schedule',
      'Coordination with nursing or lab sampling teams if immediate care is needed',
    ],
    idealFor: [
      'Elderly or mobility-impaired patients who find hospital travel exhausting',
      'Acute fever, respiratory infections, dehydration, or gastric distress',
      'Routine monthly checkups for diabetes, hypertension, and cardiac patients',
    ],
    faqs: [
      {
        q: 'What qualifications do your visiting doctors hold?',
        a: 'All visiting physicians hold an active PMDC license with an MBBS degree, and many hold post-graduate FCPS or MCPS training in Internal Medicine, Family Medicine, or Geriatrics.',
      },
      {
        q: 'Can the doctor prescribe medications and order lab tests during the home visit?',
        a: 'Yes. After examining the patient, the doctor uploads a signed digital prescription and can immediately schedule bedside blood sampling or nursing care if required.',
      },
      {
        q: 'Is this service suitable for life-threatening medical emergencies?',
        a: 'Our visiting doctors handle urgent and routine home consultations. For acute life-threatening emergencies such as heart attack or severe trauma, please call Rescue 1122 or visit the nearest hospital ER immediately.',
      },
    ],
  },
  {
    slug: 'lab-sampling',
    code: 'LAB_SAMPLING',
    name: 'Home Lab Sample Collection & Blood Tests',
    shortName: 'Lab Sampling',
    headline: 'Safe Bedside Blood Draw & Diagnostic Lab Sampling at Home',
    metaDescription:
      'Book certified phlebotomists for home blood sample collection. Partnered with ISO-accredited pathology labs with fast digital PDF reports delivered online.',
    startingPricePkr: 500,
    priceLabel: 'From PKR 500 + lab test fee',
    slaMinutes: '45–60 mins',
    councilBadge: 'ISO Accredited Partner Labs',
    overview:
      'Get accurate diagnostic blood and urine tests without leaving your bedroom. Our trained phlebotomists arrive with sealed vacutainer tubes, barcode labels, and cold-chain transport boxes to collect samples painlessly and deliver verified PDF reports directly to your portal and WhatsApp.',
    clinicalHighlights: [
      'Certified medical phlebotomists trained in painless single-prick venipuncture',
      'Sealed single-use vacutainer needles opened in front of the patient',
      'Temperature-controlled sample transport to ISO-certified pathology labs',
      'Routine & specialized panels: CBC, LFTs, RFTs, HbA1c, Lipid Profile, Thyroid, Vitamin D',
      'Verified digital PDF lab reports uploaded within 12–24 hours',
    ],
    includedItems: [
      'Sterile vacutainer blood collection kit, alcohol swabs & bandage',
      'Instant barcode sample tagging at bedside',
      'Cold-chain insulated carrier transport to partner laboratory',
      'Encrypted digital PDF report in your HomeHealth portal + WhatsApp alert',
    ],
    idealFor: [
      'Fasting morning blood tests (Lipid profile, Fasting Blood Sugar)',
      'Bedridden or elderly patients requiring routine renal/liver monitoring',
      'Busy professionals and families wanting hassle-free preventive health checkups',
    ],
    faqs: [
      {
        q: 'How soon will I receive my blood test reports?',
        a: 'Most routine hematology and biochemistry reports (CBC, LFT, RFT, Blood Sugar, Lipid Profile) are uploaded as verified PDFs within 12 to 24 hours of sample collection.',
      },
      {
        q: 'How do you ensure sample accuracy during transit?',
        a: 'Samples are collected in barcoded vacutainer tubes and transported immediately in temperature-monitored cool boxes to our ISO-certified partner pathology laboratories.',
      },
      {
        q: 'What if I need fasting blood tests?',
        a: 'You can schedule an early morning slot (7:00 AM – 10:00 AM) so your fasting sample is drawn right when you wake up.',
      },
    ],
  },
  {
    slug: 'physiotherapy',
    code: 'PHYSIOTHERAPY',
    name: 'Home Physiotherapy & Rehabilitation',
    shortName: 'Physiotherapy',
    headline: 'Licensed DPT Physiotherapists for Personalized Home Rehab',
    metaDescription:
      'Book qualified male & female DPT physiotherapists at home for stroke rehabilitation, post-knee/hip replacement recovery, back pain, frozen shoulder, and mobility therapy.',
    startingPricePkr: 2000,
    priceLabel: 'From PKR 2,000 / session',
    slaMinutes: '60 mins',
    councilBadge: 'DPT Certified Therapists',
    overview:
      'Recover strength, mobility, and independence faster with one-on-one home physiotherapy. Our Doctor of Physical Therapy (DPT) specialists design customized rehabilitation programs using portable electrotherapy modalities (TENS, EMS, Ultrasound) and guided therapeutic exercises right in your living room.',
    clinicalHighlights: [
      'Qualified Doctor of Physical Therapy (DPT) male & female specialists',
      'Post-stroke neuro-rehabilitation, gait training & balance restoration',
      'Orthopedic rehab after Total Knee Replacement (TKR), hip surgery, or fractures',
      'Acute & chronic pain relief: Sciatica, lower back pain, cervical spondylosis, frozen shoulder',
      'Portable TENS, therapeutic ultrasound, heat/cryotherapy & resistance bands included',
    ],
    includedItems: [
      '45–60 minute dedicated 1-on-1 physical therapy session',
      'Portable electrotherapy modalities (TENS / EMS / Ultrasound) as clinically indicated',
      'Customized home exercise regimen & family caregiver guidance',
      'Session-by-session mobility progress tracking in your digital health record',
    ],
    idealFor: [
      'Stroke, paralysis, or Parkinson’s patients needing consistent neuro-motor rehab',
      'Post-surgical orthopedic patients (knee/hip replacement, ligament repair)',
      'Seniors and office workers suffering from severe back, neck, or joint pain',
    ],
    faqs: [
      {
        q: 'Do physiotherapists bring their own therapy machines to the home?',
        a: 'Yes. Our physiotherapists carry portable TENS units, muscle stimulators, therapeutic ultrasound devices, and exercise bands needed for your session.',
      },
      {
        q: 'Do you offer discounted weekly or monthly physiotherapy packages?',
        a: 'Yes, we offer structured 7-day, 14-day, and 30-day rehabilitation packages at discounted per-session rates with the same dedicated physiotherapist.',
      },
      {
        q: 'Can I book a female physiotherapist for a female patient?',
        a: 'Yes, we have experienced female DPT physiotherapists available across all major city zones.',
      },
    ],
  },
  {
    slug: 'caregiver',
    code: 'CAREGIVER',
    name: 'Trained Home Caregiver & Patient Attendant',
    shortName: 'Caregiver Support',
    headline: 'Compassionate, Vetted Patient Attendants & Elderly Caregivers',
    metaDescription:
      'Hire background-checked 12-hour or 24-hour home caregivers and patient attendants for elderly parents, bedridden patients, dementia support, and daily living assistance.',
    startingPricePkr: 1800,
    priceLabel: 'From PKR 1,800 / shift',
    slaMinutes: '2–4 hours',
    councilBadge: 'CNIC & Police Verified',
    overview:
      'When an elderly parent or recovering family member needs attentive daily support, our trained patient attendants provide dignified, compassionate bedside care. From personal hygiene, sponge bathing, and diaper changes to meal feeding, oral medication reminders, and wheelchair mobility, we support your family round the clock.',
    clinicalHighlights: [
      'Thoroughly vetted, CNIC & police-verified male and female patient attendants',
      'Flexible 12-hour day/night shifts and 24-hour live-in care packages',
      'Personal hygiene support: sponge bath, grooming, toileting & incontinence care',
      'Bed-turning every 2 hours for pressure ulcer (bed-sore) prevention',
      'Assistive mobility, fall prevention, feeding support & timely medication reminders',
    ],
    includedItems: [
      'Dedicated attendant shift (single visit, weekly, or monthly plan)',
      'Daily vitals log, fluid intake/output chart & nutrition tracking',
      'Supervisor check-ins and replacement guarantee if staff is on leave',
      'Direct coordination with HomeHealth nurses and doctors when clinical care is needed',
    ],
    idealFor: [
      'Elderly parents living alone or needing daily physical assistance',
      'Bedridden, paralyzed, or dementia/Alzheimer’s patients requiring constant supervision',
      'Post-discharge hospital patients transitioning back to home life',
    ],
    faqs: [
      {
        q: 'What is the difference between a Home Nurse and a Caregiver Attendant?',
        a: 'A Registered Nurse performs invasive clinical procedures (IV drips, injections, sterile wound dressings, catheterization), whereas a Caregiver Attendant focuses on daily living support (bathing, feeding, diaper changes, mobility, and companionship).',
      },
      {
        q: 'What happens if our assigned caregiver falls sick or needs a day off?',
        a: 'For weekly and monthly packages, our care desk arranges a verified backup attendant so your loved one’s care continues without interruption.',
      },
      {
        q: 'How are caregivers background-checked?',
        a: 'Every caregiver completesNADRA CNIC verification, residential address verification, reference checks, police clearance, and practical bedside care training.',
      },
    ],
  },
  {
    slug: 'ambulance',
    code: 'AMBULANCE',
    name: 'Patient Transport & Ambulance Service',
    shortName: 'Ambulance Service',
    headline: 'Oxygen-Equipped Patient Transport & Ambulance Dispatch',
    metaDescription:
      'Book air-conditioned, oxygen-equipped ambulances with trained paramedics for safe hospital-to-home discharges, diagnostic center transfers, and inter-city patient transport.',
    startingPricePkr: 3500,
    priceLabel: 'From PKR 3,500 / trip',
    slaMinutes: '20–30 mins',
    councilBadge: 'Paramedic Equipped',
    overview:
      'Ensure safe, smooth medical transit for your loved ones. Our clean, air-conditioned patient transport ambulances are equipped with medical oxygen cylinders, hydraulic stretchers, pulse oximeters, suction machines, and a trained paramedic to monitor vitals from bedside to hospital or back home.',
    clinicalHighlights: [
      'Clean, sanitized, air-conditioned ambulances with smooth-ride stretchers',
      'Onboard medical oxygen cylinder, regulator, masks & portable suction unit',
      'Trained paramedic / EMT onboard for continuous SpO2 and BP monitoring',
      'Bed-to-bed transfer assistance (including stairs carry chair if needed)',
      'Hospital discharge transfers, MRI/CT scan trips & inter-city medical transport',
    ],
    includedItems: [
      'Equipped ambulance vehicle with fuel and driver',
      'Onboard paramedic attendant & vital signs monitoring during transit',
      'Oxygen support and disposable oxygen mask/nasal cannula if required',
      'Bedside-to-bedside stretcher transfer assistance',
    ],
    idealFor: [
      'Safe hospital discharge transport for post-surgical or ICU step-down patients',
      'Taking bedridden patients to hospital for dialysis, CT/MRI scans, or specialist visits',
      'Inter-city non-emergency medical transfers with continuous oxygen/nursing support',
    ],
    faqs: [
      {
        q: 'Do your ambulances include oxygen and a paramedic?',
        a: 'Yes, every ambulance dispatch includes a full medical oxygen cylinder, vital signs monitor, stretcher, and a trained paramedic attendant.',
      },
      {
        q: 'Will the crew help move the patient from an upper-floor bedroom to the ambulance?',
        a: 'Yes, our crew assists with bed-to-stretcher transfer so family members do not have to lift the patient alone.',
      },
      {
        q: 'Can we book an ambulance in advance for a scheduled hospital discharge or MRI appointment?',
        a: 'Yes, you can pre-book a specific pickup time for hospital discharges, dialysis sessions, or diagnostic imaging appointments.',
      },
    ],
  },
];

export const SEO_CITIES: SeoCitySpec[] = [
  {
    slug: 'faisalabad',
    name: 'Faisalabad',
    province: 'Punjab',
    isPrimaryHub: true,
    etaRange: '45–60 mins',
    helpline: '+92 300 1234567',
    coordinates: { lat: '31.4504', lng: '73.1350' },
    zones: [
      'Peoples Colony No. 1 & 2',
      'Madina Town & Susan Road',
      'Gulberg & Jinnah Colony',
      'Kohinoor City & D Ground',
      'Canal Road & Eden Valley',
      'Civil Lines & Club Road',
      'Millat Town & Sargodha Road',
      'Samanabad & Batala Colony',
      'Wapda City & Citi Housing',
      'Satiana Road & Jaranwala Road',
    ],
    localHospitals: [
      'Allied Hospital Faisalabad',
      'Faisalabad Institute of Cardiology (FIC)',
      'Mujahid Hospital',
      'Aziz Fatimah Hospital',
      'National Hospital',
    ],
    description:
      'Faisalabad is our flagship operational hub with 24/7 rapid dispatch across all central towns, housing societies, and canal-side sectors.',
  },
  {
    slug: 'lahore',
    name: 'Lahore',
    province: 'Punjab',
    isPrimaryHub: false,
    etaRange: '45–60 mins',
    helpline: '+92 300 1234567',
    coordinates: { lat: '31.5204', lng: '74.3587' },
    zones: [
      'DHA Phases 1–8',
      'Gulberg & Cavalary Ground',
      'Johar Town & Wapda Town',
      'Model Town & Garden Town',
      'Bahria Town & Valencia',
      'Lahore Cantt & Askari',
      'Iqbal Town & Samanabad',
      'Faisal Town & Shadman',
    ],
    localHospitals: [
      'Shaukat Khanum Hospital',
      'Doctors Hospital',
      'Hameed Latif Hospital',
      'Evercare Hospital',
      'Services & Mayo Hospital',
    ],
    description:
      'Comprehensive home healthcare coverage across Lahore with verified PNC nurses, PMDC doctors, and home blood collection teams.',
  },
  {
    slug: 'islamabad',
    name: 'Islamabad',
    province: 'Islamabad Capital Territory',
    isPrimaryHub: false,
    etaRange: '45–60 mins',
    helpline: '+92 300 1234567',
    coordinates: { lat: '33.6844', lng: '73.0479' },
    zones: [
      'Sectors F-6, F-7, F-8, F-10, F-11',
      'Sectors G-6, G-8, G-9, G-10, G-11, G-13',
      'Sectors E-7, E-11 & D-12',
      'Sector I-8, I-9, I-10',
      'DHA Islamabad & Bahria Enclave',
      'Bani Gala & Chak Shahzad',
    ],
    localHospitals: [
      'Shifa International Hospital',
      'PIMS Islamabad',
      'Maroof International Hospital',
      'Kulsum International Hospital',
      'Quaid-e-Azam International Hospital',
    ],
    description:
      'Hospital-standard home medical consultations, elderly nursing, and physiotherapy across all sectors and housing enclaves of Islamabad.',
  },
  {
    slug: 'rawalpindi',
    name: 'Rawalpindi',
    province: 'Punjab',
    isPrimaryHub: false,
    etaRange: '45–60 mins',
    helpline: '+92 300 1234567',
    coordinates: { lat: '33.5651', lng: '73.0169' },
    zones: [
      'Bahria Town Phases 1–8',
      'Chaklala Scheme 3 & Askari',
      'Satellite Town & Commercial Market',
      'Saddar & Peshawar Road',
      'Gulraiz Housing Scheme',
      'Westridge & Lalazar',
    ],
    localHospitals: [
      'Combined Military Hospital (CMH)',
      'Military Hospital (MH)',
      'Holy Family Hospital',
      'Benazir Bhutto Hospital',
      'Hearts International Hospital',
    ],
    description:
      'Dedicated home nursing, post-operative dressing, and doctor visits serving families across Rawalpindi Cantt, Satellite Town, and Bahria Town.',
  },
  {
    slug: 'multan',
    name: 'Multan',
    province: 'Punjab',
    isPrimaryHub: false,
    etaRange: '45–60 mins',
    helpline: '+92 300 1234567',
    coordinates: { lat: '30.1575', lng: '71.5249' },
    zones: [
      'Multan Cantt & Abdali Road',
      'Gulgasht Colony & Bosan Road',
      'Model Town & Buch Executive Villas',
      'Wapda Town & DHA Multan',
      'New Multan & Shah Rukn-e-Alam',
      'Mumtazabad & Citi Housing',
    ],
    localHospitals: [
      'Nishtar Hospital Multan',
      'Chaudhry Pervaiz Elahi Institute of Cardiology',
      'Bakhtawar Amin Hospital',
      'Medicare Hospital',
    ],
    description:
      'Bringing verified bedside healthcare, lab sample collection, and physiotherapy to families across Multan.',
  },
  {
    slug: 'gujranwala',
    name: 'Gujranwala',
    province: 'Punjab',
    isPrimaryHub: false,
    etaRange: '45–60 mins',
    helpline: '+92 300 1234567',
    coordinates: { lat: '32.1877', lng: '74.1945' },
    zones: [
      'Citi Housing & Wapda Town',
      'Model Town & Civil Lines',
      'Satellite Town & Peoples Colony',
      'Gujranwala Cantt & Rahwali',
      'Master City & DC Colony',
      'GT Road Corridor',
    ],
    localHospitals: [
      'DHQ Teaching Hospital Gujranwala',
      'Gondal Medical Complex',
      'Medcare International Hospital',
      'Siddique Sadiq Memorial Hospital',
    ],
    description:
      'Trusted home nursing, doctor visits, and diagnostic blood collection across Gujranwala’s housing societies and central towns.',
  },
];

export function findSeoService(slugOrCode?: string): SeoServiceSpec | undefined {
  if (!slugOrCode) return undefined;
  const normalized = slugOrCode.trim().toLowerCase();
  return SEO_SERVICES.find(
    (s) => s.slug === normalized || s.code.toLowerCase() === normalized,
  );
}

export function findSeoCity(slugOrName?: string): SeoCitySpec | undefined {
  if (!slugOrName) return undefined;
  const normalized = slugOrName.trim().toLowerCase();
  return SEO_CITIES.find(
    (c) => c.slug === normalized || c.name.toLowerCase() === normalized,
  );
}
