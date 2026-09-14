import type { Schema, Struct } from '@strapi/strapi';

export interface AboutCertificateItem extends Struct.ComponentSchema {
  collectionName: 'components_about_certificate_items';
  info: {
    description: 'Accreditation or certificate with title, image preview, download file or URL';
    displayName: 'Certificate Item';
    icon: 'award';
  };
  attributes: {
    file: Schema.Attribute.Media<'files' | 'images'>;
    image: Schema.Attribute.Media<'images'>;
    imageUrl: Schema.Attribute.String;
    title: Schema.Attribute.String & Schema.Attribute.Required;
    url: Schema.Attribute.String;
  };
}

export interface AboutTimelineMilestone extends Struct.ComponentSchema {
  collectionName: 'components_about_timeline_milestones';
  info: {
    description: 'Historical milestone entry with year, title, body, and image';
    displayName: 'Timeline Milestone';
    icon: 'clock';
  };
  attributes: {
    body: Schema.Attribute.Text & Schema.Attribute.Required;
    image: Schema.Attribute.Media<'images'>;
    imageUrl: Schema.Attribute.String;
    title: Schema.Attribute.String & Schema.Attribute.Required;
    year: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface AboutValueItem extends Struct.ComponentSchema {
  collectionName: 'components_about_value_items';
  info: {
    description: 'Core value item with key, label, and icon identifier';
    displayName: 'Core Value Item';
    icon: 'sparkles';
  };
  attributes: {
    iconName: Schema.Attribute.String;
    key: Schema.Attribute.String & Schema.Attribute.Required;
    label: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface AboutWhyChooseItem extends Struct.ComponentSchema {
  collectionName: 'components_about_why_choose_items';
  info: {
    description: 'Individual reason card with key, title, body, and icon';
    displayName: 'Why Choose Item';
    icon: 'check-circle';
  };
  attributes: {
    body: Schema.Attribute.Text & Schema.Attribute.Required;
    iconName: Schema.Attribute.String;
    key: Schema.Attribute.String & Schema.Attribute.Required;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface AcademicApproachItem extends Struct.ComponentSchema {
  collectionName: 'components_academic_approach_items';
  info: {
    description: 'Item in the How Learning Comes to Life section';
    displayName: 'Approach Item';
    icon: 'bulletList';
  };
  attributes: {
    description: Schema.Attribute.Text & Schema.Attribute.Required;
    icon: Schema.Attribute.String & Schema.Attribute.DefaultTo<'Zap'>;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface AcademicPathwayStep extends Struct.ComponentSchema {
  collectionName: 'components_academic_pathway_steps';
  info: {
    description: 'A single curriculum or learning progression step in an academic program';
    displayName: 'Pathway Step';
    icon: 'check';
  };
  attributes: {
    description: Schema.Attribute.Text & Schema.Attribute.Required;
    stageNumber: Schema.Attribute.Integer;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface ContactCampusInfo extends Struct.ComponentSchema {
  collectionName: 'components_contact_campus_infos';
  info: {
    description: '';
    displayName: 'Campus Info';
    icon: 'pinMap';
  };
  attributes: {
    address: Schema.Attribute.Text & Schema.Attribute.Required;
    addressLabel: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'Main Campus'>;
    campusTitle: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'Campus Information'>;
    email: Schema.Attribute.Email & Schema.Attribute.Required;
    emailLabel: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'Admissions Desk'>;
    latitude: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<6.3005>;
    longitude: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<-10.7969>;
    mapUrl: Schema.Attribute.Text;
    officeHours: Schema.Attribute.Text &
      Schema.Attribute.DefaultTo<'Monday - Friday: 8:00 AM - 4:00 PM\nFriday Prayer Break: 12:00 PM - 2:00 PM'>;
    officeHoursLabel: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'Office Hours'>;
    phone: Schema.Attribute.String & Schema.Attribute.Required;
    phoneLabel: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'Administration'>;
    whatsapp: Schema.Attribute.String;
    whatsappLabel: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'WhatsApp Us'>;
  };
}

export interface ContactContactForm extends Struct.ComponentSchema {
  collectionName: 'components_contact_contact_forms';
  info: {
    description: '';
    displayName: 'Form Settings';
    icon: 'envelop';
  };
  attributes: {
    formEmailLabel: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'Email Address'>;
    formEmailPlaceholder: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'musakamara@gmail.com'>;
    formFirstNameLabel: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'First Name'>;
    formFirstNamePlaceholder: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'e.g. Musa'>;
    formLastNameLabel: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'Last Name'>;
    formLastNamePlaceholder: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'e.g. Kamara'>;
    formMessageLabel: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'Your Message'>;
    formMessagePlaceholder: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'How can we assist you today?'>;
    formPhoneLabel: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'Phone Number'>;
    formSubjectLabel: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'Subject Area'>;
    formSubmitButtonText: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'Send Message'>;
    formTermsLinkText: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'Read the legal terms and service,'>;
    formTermsSuffix: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'I have accept it'>;
    formTitle: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'Send us a message'>;
  };
}

export interface ContactSocialMedia extends Struct.ComponentSchema {
  collectionName: 'components_contact_social_medias';
  info: {
    description: 'A single social media link';
    displayName: 'Social Media Link';
    icon: 'twitter';
  };
  attributes: {
    title: Schema.Attribute.String & Schema.Attribute.Required;
    url: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface ErpBehaviorRecord extends Struct.ComponentSchema {
  collectionName: 'components_erp_behavior_records';
  info: {
    description: 'Student conduct and behavior monitoring records (Green/Yellow/Red)';
    displayName: 'Behavior Record';
    icon: 'shield-alert';
  };
  attributes: {
    category: Schema.Attribute.String & Schema.Attribute.Required;
    date: Schema.Attribute.Date & Schema.Attribute.Required;
    description: Schema.Attribute.RichText & Schema.Attribute.Required;
    followUpRequired: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<false>;
    level: Schema.Attribute.Enumeration<['green', 'yellow', 'red']> &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'green'>;
    parentNotified: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<false>;
    recommendation: Schema.Attribute.Text;
    resolution: Schema.Attribute.Text;
    teacherName: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface ErpEnrollmentRecord extends Struct.ComponentSchema {
  collectionName: 'components_erp_enrollment_records';
  info: {
    description: 'Historical and active multi-section academic enrollment records';
    displayName: 'Enrollment Record';
    icon: 'user-check';
  };
  attributes: {
    academicYear: Schema.Attribute.String & Schema.Attribute.Required;
    enrollmentDate: Schema.Attribute.Date & Schema.Attribute.Required;
    notes: Schema.Attribute.Text;
    primarySection: Schema.Attribute.String & Schema.Attribute.Required;
    secondarySections: Schema.Attribute.JSON;
    status: Schema.Attribute.Enumeration<
      ['active', 'completed', 'transferred', 'withdrawn']
    > &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'active'>;
    term: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface ErpMedicalRecord extends Struct.ComponentSchema {
  collectionName: 'components_erp_medical_records';
  info: {
    description: 'Student health and clinic emergency instruction summary';
    displayName: 'Medical Record';
    icon: 'heart';
  };
  attributes: {
    bloodGroup: Schema.Attribute.Enumeration<
      ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
    >;
    currentMedications: Schema.Attribute.Text;
    emergencyInstructions: Schema.Attribute.RichText;
    hospitalClinic: Schema.Attribute.String;
    insuranceDetails: Schema.Attribute.Text;
    medicalConditions: Schema.Attribute.Text;
    primaryDoctor: Schema.Attribute.String;
    vaccinationHistory: Schema.Attribute.Text;
  };
}

export interface ErpStaffNote extends Struct.ComponentSchema {
  collectionName: 'components_erp_staff_notes';
  info: {
    description: 'Authorized staff notes with priority and visibility levels';
    displayName: 'Staff Note';
    icon: 'file-text';
  };
  attributes: {
    author: Schema.Attribute.String & Schema.Attribute.Required;
    category: Schema.Attribute.String & Schema.Attribute.Required;
    content: Schema.Attribute.RichText & Schema.Attribute.Required;
    date: Schema.Attribute.Date & Schema.Attribute.Required;
    priority: Schema.Attribute.Enumeration<
      ['low', 'normal', 'high', 'urgent']
    > &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'normal'>;
    visibility: Schema.Attribute.Enumeration<
      ['internal_staff_only', 'share_with_parent', 'share_with_student']
    > &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'internal_staff_only'>;
  };
}

export interface ErpTimelineItem extends Struct.ComponentSchema {
  collectionName: 'components_erp_timeline_items';
  info: {
    description: 'Chronological milestone entries for student ERP timeline';
    displayName: 'Timeline Item';
    icon: 'clock';
  };
  attributes: {
    category: Schema.Attribute.Enumeration<
      [
        'Admission',
        'Department Change',
        'Section Change',
        'Parent Update',
        'Hostel Assignment',
        'Behavior Record',
        'Certificate',
        'Exam',
        'Attendance Milestone',
        'Transfer',
        'Graduation',
      ]
    > &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'Admission'>;
    date: Schema.Attribute.Date & Schema.Attribute.Required;
    description: Schema.Attribute.RichText;
    loggedBy: Schema.Attribute.String;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface HomeActivityCard extends Struct.ComponentSchema {
  collectionName: 'components_home_activity_cards';
  info: {
    description: 'Activity card for student life section on homepage';
    displayName: 'Activity Card';
  };
  attributes: {
    image: Schema.Attribute.Media<'images'>;
    title: Schema.Attribute.String;
  };
}

export interface HomeHeroSlide extends Struct.ComponentSchema {
  collectionName: 'components_home_hero_slides';
  info: {
    description: 'Slide item for the homepage hero carousel';
    displayName: 'Hero Slide';
  };
  attributes: {
    description: Schema.Attribute.Text;
    image: Schema.Attribute.Media<'images'>;
    titlePart1: Schema.Attribute.String;
    titlePart2: Schema.Attribute.String;
  };
}

export interface HomeTestimonialItem extends Struct.ComponentSchema {
  collectionName: 'components_home_testimonial_items';
  info: {
    description: 'Community testimonial item for homepage';
    displayName: 'Testimonial Item';
  };
  attributes: {
    image: Schema.Attribute.Media<'images'>;
    name: Schema.Attribute.String;
    quote: Schema.Attribute.Text;
    rating: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<5>;
    role: Schema.Attribute.String;
    title: Schema.Attribute.String;
  };
}

export interface LoginFeatureItem extends Struct.ComponentSchema {
  collectionName: 'components_login_feature_items';
  info: {
    description: 'Highlight feature bullet for the login branding panel';
    displayName: 'Feature Item';
    icon: 'shield';
  };
  attributes: {
    icon: Schema.Attribute.String & Schema.Attribute.DefaultTo<'Shield'>;
    text: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
  };
}

export interface NavigationMegaMenuItem extends Struct.ComponentSchema {
  collectionName: 'components_navigation_mega_menu_items';
  info: {
    description: 'A sub-link for mega menus with a title, badge, and image.';
    displayName: 'Mega Menu Item';
    icon: 'layer';
  };
  attributes: {
    badge: Schema.Attribute.String;
    media: Schema.Attribute.Media<'images'>;
    title: Schema.Attribute.String & Schema.Attribute.Required;
    url: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface NavigationMenuItem extends Struct.ComponentSchema {
  collectionName: 'components_navigation_menu_items';
  info: {
    description: 'Navigation menu link item with optional icon and child submenus';
    displayName: 'Menu Item';
    icon: 'link';
  };
  attributes: {
    icon: Schema.Attribute.String;
    isVisible: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    order: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    subItems: Schema.Attribute.Component<'navigation.mega-menu-item', true>;
    target: Schema.Attribute.Enumeration<['_self', '_blank']> &
      Schema.Attribute.DefaultTo<'_self'>;
    title: Schema.Attribute.String & Schema.Attribute.Required;
    url: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface SectionsAboutCertificates extends Struct.ComponentSchema {
  collectionName: 'components_sections_about_certificates';
  info: {
    description: 'Certificates and accreditations slider with preview images and download links';
    displayName: 'About Certificates & Accreditations';
    icon: 'medal';
  };
  attributes: {
    certificates: Schema.Attribute.Component<'about.certificate-item', true>;
    title: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'Accreditations & Certificates'>;
  };
}

export interface SectionsAboutDirector extends Struct.ComponentSchema {
  collectionName: 'components_sections_about_directors';
  info: {
    description: 'Founding director quote and bio panel with portrait, title, 3 quote paragraphs, and signature';
    displayName: 'About Founding Director';
    icon: 'user-check';
  };
  attributes: {
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'Dr. Yahaya Kromah'>;
    portrait: Schema.Attribute.Media<'images'>;
    portraitUrl: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'/images/figma-home/08-activity.jpeg'>;
    quoteP1: Schema.Attribute.Text &
      Schema.Attribute.DefaultTo<'When we laid the cornerstone of Yahaya International, our aspiration was clear: to create an institution that neither compromises on academic excellence nor dilutes our sacred Islamic identity. Knowledge without moral purpose is adrift, and devotion without intellectual rigor is incomplete.'>;
    quoteP2: Schema.Attribute.Text &
      Schema.Attribute.DefaultTo<"Today, seeing our students master British curriculum mathematics while memorising the Qur'an with profound understanding confirms that this vision is not only possible \u2014 it is the future of Muslim education.">;
    quoteP3: Schema.Attribute.Text &
      Schema.Attribute.DefaultTo<'We welcome every family that shares our belief that education should cultivate both the mind and the soul.'>;
    quoteTitle: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'A word from our founding director'>;
    role: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'Founding Director'>;
    signature: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'Dr. Yahaya Kromah, Ph.D. \u2014 Founding Director'>;
  };
}

export interface SectionsAboutIntro extends Struct.ComponentSchema {
  collectionName: 'components_sections_about_intros';
  info: {
    description: 'About page intro with badge, two-line heading, description, and hero campus image';
    displayName: 'About Intro Section';
    icon: 'book-open';
  };
  attributes: {
    badge: Schema.Attribute.String & Schema.Attribute.DefaultTo<'EST. 2020'>;
    description: Schema.Attribute.Text &
      Schema.Attribute.DefaultTo<'Founded on principles of holistic human development, Yahaya International blends rigorous British academic standards with grounded Islamic values. We prepare young minds to excel in higher education, lead with moral clarity, and contribute meaningfully to a global society.'>;
    image: Schema.Attribute.Media<'images'>;
    imageUrl: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'/images/figma-home/03-programs.jpeg'>;
    title1: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'Education, Practice'>;
    title2: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'and Advocacy'>;
  };
}

export interface SectionsAboutMissionVision extends Struct.ComponentSchema {
  collectionName: 'components_sections_about_mission_visions';
  info: {
    description: 'Interactive Mission and Vision panel with crest mask, tab labels, copy, and images';
    displayName: 'About Mission & Vision';
    icon: 'compass';
  };
  attributes: {
    missionBody: Schema.Attribute.Text &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'To provide an exemplary dual-curriculum education that cultivates intellectual curiosity, Islamic character, and global leadership skills in every learner.'>;
    missionImage: Schema.Attribute.Media<'images'>;
    missionImageUrl: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'/images/vission.png'>;
    missionLabel: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'Our Mission'>;
    visionBody: Schema.Attribute.Text &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'To be recognized globally as the benchmark institution for modern Islamic excellence, where academic brilliance and spiritual depth converge.'>;
    visionImage: Schema.Attribute.Media<'images'>;
    visionImageUrl: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'/images/figma-home/02-about.jpeg'>;
    visionLabel: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'Our Vision'>;
  };
}

export interface SectionsAboutTimeline extends Struct.ComponentSchema {
  collectionName: 'components_sections_about_timelines';
  info: {
    description: 'School history timeline slider with year navigation, parallax photos, and milestone narratives';
    displayName: 'About Timeline Section';
    icon: 'calendar';
  };
  attributes: {
    milestones: Schema.Attribute.Component<'about.timeline-milestone', true>;
    title: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'Our Timeline'>;
  };
}

export interface SectionsAboutValues extends Struct.ComponentSchema {
  collectionName: 'components_sections_about_values';
  info: {
    description: 'Core values bar with title, description, and repeatable value items';
    displayName: 'About Core Values Bar';
    icon: 'shield-check';
  };
  attributes: {
    description: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'Principles guiding every action'>;
    title: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'Our Core Values'>;
    values: Schema.Attribute.Component<'about.value-item', true>;
  };
}

export interface SectionsAboutWhyChoose extends Struct.ComponentSchema {
  collectionName: 'components_sections_about_why_chooses';
  info: {
    description: 'Why choose Yahaya International section with title, description, and reason cards';
    displayName: 'About Why Choose Section';
    icon: 'thumbs-up';
  };
  attributes: {
    description: Schema.Attribute.Text &
      Schema.Attribute.DefaultTo<'We bring together two rich educational traditions \u2014 the academic depth of the British National Curriculum and the spiritual and intellectual heritage of Classical Islamic scholarship.'>;
    reasons: Schema.Attribute.Component<'about.why-choose-item', true>;
    title: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'Why Choose Yahaya International?'>;
  };
}

export interface SectionsCtaBanner extends Struct.ComponentSchema {
  collectionName: 'components_sections_cta_banners';
  info: {
    description: 'High-conversion call to action banner for admissions or inquiries';
    displayName: 'Call To Action Banner';
    icon: 'bullhorn';
  };
  attributes: {
    buttonText: Schema.Attribute.String & Schema.Attribute.Required;
    buttonUrl: Schema.Attribute.String & Schema.Attribute.Required;
    description: Schema.Attribute.Text;
    themeStyle: Schema.Attribute.Enumeration<['emerald', 'gold', 'dark']> &
      Schema.Attribute.DefaultTo<'emerald'>;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface SectionsDepartmentsGrid extends Struct.ComponentSchema {
  collectionName: 'components_sections_departments_grids';
  info: {
    description: 'Showcase grid of academic and administrative departments';
    displayName: 'Departments Grid';
    icon: 'briefcase';
  };
  attributes: {
    limit: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<6>;
    subtitle: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'Explore our specialized faculty departments'>;
    title: Schema.Attribute.String & Schema.Attribute.DefaultTo<'Departments'>;
  };
}

export interface SectionsDonationBanner extends Struct.ComponentSchema {
  collectionName: 'components_sections_donation_banners';
  info: {
    description: 'Call to action banner highlighting ongoing school development campaigns';
    displayName: 'Donation Banner Section';
    icon: 'heart';
  };
  attributes: {
    badge: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'Sadaqah Jariyah'>;
    buttonText: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'Donate Now'>;
    buttonUrl: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'/donations'>;
    description: Schema.Attribute.Text &
      Schema.Attribute.DefaultTo<'Your contributions help build state-of-the-art laboratories, mosques, and scholarship funds for deserving students.'>;
    title: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'Support School Development & Islamic Endowment (Waqf)'>;
  };
}

export interface SectionsEventsGrid extends Struct.ComponentSchema {
  collectionName: 'components_sections_events_grids';
  info: {
    description: 'Showcase of upcoming school events with countdown timer support';
    displayName: 'Upcoming Events Grid';
    icon: 'calendar';
  };
  attributes: {
    limit: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<3>;
    subtitle: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'Mark your calendar for our upcoming school activities'>;
    title: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'Upcoming Events'>;
  };
}

export interface SectionsFeatureCards extends Struct.ComponentSchema {
  collectionName: 'components_sections_feature_cards';
  info: {
    description: 'Grid of core feature or value proposition cards';
    displayName: 'Feature Cards Section';
    icon: 'apps';
  };
  attributes: {
    cards: Schema.Attribute.JSON;
    subtitle: Schema.Attribute.String;
    title: Schema.Attribute.String;
  };
}

export interface SectionsGalleryPreview extends Struct.ComponentSchema {
  collectionName: 'components_sections_gallery_previews';
  info: {
    description: 'Preview grid of school photos and videos';
    displayName: 'Gallery Preview Section';
    icon: 'picture';
  };
  attributes: {
    mediaItems: Schema.Attribute.Media<'images' | 'videos', true>;
    subtitle: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'A glimpse into academic and student life at YAHAYASCOOL'>;
    title: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'Campus Life & Gallery'>;
    viewAllUrl: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'/gallery'>;
  };
}

export interface SectionsHero extends Struct.ComponentSchema {
  collectionName: 'components_sections_heroes';
  info: {
    description: 'Primary banner section with badge, title, subtitle, CTA buttons, and background image/video';
    displayName: 'Hero Section';
    icon: 'layout';
  };
  attributes: {
    backgroundMedia: Schema.Attribute.Media<'images' | 'videos'>;
    badge: Schema.Attribute.String;
    primaryCtaText: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'Apply Now'>;
    primaryCtaUrl: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'/admissions'>;
    secondaryCtaText: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'Explore Programs'>;
    secondaryCtaUrl: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'/programs'>;
    subtitle: Schema.Attribute.Text;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface SectionsNewsFeaturedEvent extends Struct.ComponentSchema {
  collectionName: 'components_sections_news_featured_events';
  info: {
    description: 'Featured event slider item for the news page';
    displayName: 'News Featured Event';
  };
  attributes: {
    author: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'School Communications'>;
    blurb: Schema.Attribute.Text;
    body: Schema.Attribute.RichText;
    buttonText: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'Read More'>;
    category: Schema.Attribute.String;
    date: Schema.Attribute.Date;
    day: Schema.Attribute.String;
    eyebrow: Schema.Attribute.String;
    gallery: Schema.Attribute.Media<'images', true>;
    headlineLine1: Schema.Attribute.String;
    headlineLine2: Schema.Attribute.String;
    href: Schema.Attribute.String;
    image: Schema.Attribute.Media<'images'>;
    lede: Schema.Attribute.Text;
    month: Schema.Attribute.String;
    place: Schema.Attribute.String;
    tags: Schema.Attribute.Component<'shared.tag', true>;
    time: Schema.Attribute.String;
    title: Schema.Attribute.String;
  };
}

export interface SectionsNewsGrid extends Struct.ComponentSchema {
  collectionName: 'components_sections_news_grids';
  info: {
    description: 'Grid or carousel of latest school news articles';
    displayName: 'Latest News Grid';
    icon: 'paper-plane';
  };
  attributes: {
    categoryFilter: Schema.Attribute.String;
    limit: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<3>;
    subtitle: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'Stay informed on what is happening at YAHAYASCOOL'>;
    title: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'Latest News & Updates'>;
  };
}

export interface SectionsNewsletterSignup extends Struct.ComponentSchema {
  collectionName: 'components_sections_newsletter_signups';
  info: {
    description: 'Email newsletter subscription prompt section';
    displayName: 'Newsletter Signup Block';
    icon: 'envelop';
  };
  attributes: {
    buttonText: Schema.Attribute.String &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }> &
      Schema.Attribute.DefaultTo<'Subscribe'>;
    placeholderText: Schema.Attribute.String &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }> &
      Schema.Attribute.DefaultTo<'Email Address'>;
    subtitle: Schema.Attribute.Text &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }> &
      Schema.Attribute.DefaultTo<'Get the latest school news and event reminders straight to your inbox.'>;
    title: Schema.Attribute.String &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }> &
      Schema.Attribute.DefaultTo<'Stay Updated'>;
  };
}

export interface SectionsPrincipalWelcome extends Struct.ComponentSchema {
  collectionName: 'components_sections_principal_welcomes';
  info: {
    description: 'Welcome message and introduction from the School Principal / Director';
    displayName: 'Principal Welcome Section';
    icon: 'user';
  };
  attributes: {
    avatar: Schema.Attribute.Media<'images'>;
    message: Schema.Attribute.Text & Schema.Attribute.Required;
    principalName: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'Sheikh Dr. Yahaya Al-Hassan'>;
    principalTitle: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'Director General & Principal'>;
    quote: Schema.Attribute.String;
    sectionBadge: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<"Principal's Welcome">;
    title: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'Nurturing Academic Excellence & Moral Integrity'>;
  };
}

export interface SectionsProgramsGrid extends Struct.ComponentSchema {
  collectionName: 'components_sections_programs_grids';
  info: {
    description: 'Showcase grid of academic programs dynamically loaded from CMS';
    displayName: 'Academic Programs Grid';
    icon: 'book';
  };
  attributes: {
    limit: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<6>;
    showFeaturedOnly: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<true>;
    subtitle: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'Excellence in Islamic and Western Education'>;
    title: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'Our Academic Programs'>;
  };
}

export interface SectionsSponsorsGrid extends Struct.ComponentSchema {
  collectionName: 'components_sections_sponsors_grids';
  info: {
    description: 'Grid display of school accreditation bodies, educational partners, and waqf sponsors';
    displayName: 'Partners & Sponsors Grid';
    icon: 'hand-heart';
  };
  attributes: {
    partnersList: Schema.Attribute.JSON;
    subtitle: Schema.Attribute.String;
    title: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'Accreditations & Global Partners'>;
  };
}

export interface SectionsStats extends Struct.ComponentSchema {
  collectionName: 'components_sections_stats';
  info: {
    description: 'Grid of statistical highlights (e.g., 100% Pass Rate, 1200+ Students)';
    displayName: 'Quick Statistics Section';
    icon: 'bullet-list';
  };
  attributes: {
    statsList: Schema.Attribute.JSON;
    subtitle: Schema.Attribute.String;
    title: Schema.Attribute.String;
  };
}

export interface SectionsTestimonialsSlider extends Struct.ComponentSchema {
  collectionName: 'components_sections_testimonials_sliders';
  info: {
    description: 'Carousel or grid of parent, student, and alumni testimonials';
    displayName: 'Testimonials Slider';
    icon: 'quote';
  };
  attributes: {
    limit: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<6>;
    subtitle: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'Testimonials from the YAHAYASCOOL community'>;
    title: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'What Parents & Students Say'>;
  };
}

export interface SeoMeta extends Struct.ComponentSchema {
  collectionName: 'components_seo_metas';
  info: {
    description: 'SEO metadata including title, description, keywords, OpenGraph, and Schema.org';
    displayName: 'SEO Meta';
    icon: 'search';
  };
  attributes: {
    canonicalUrl: Schema.Attribute.String;
    keywords: Schema.Attribute.String;
    metaDescription: Schema.Attribute.Text & Schema.Attribute.Required;
    metaTitle: Schema.Attribute.String & Schema.Attribute.Required;
    ogDescription: Schema.Attribute.Text;
    ogImage: Schema.Attribute.Media<'images'>;
    ogTitle: Schema.Attribute.String;
    twitterCardType: Schema.Attribute.Enumeration<
      ['summary', 'summary_large_image']
    > &
      Schema.Attribute.DefaultTo<'summary_large_image'>;
  };
}

export interface SharedBankAccount extends Struct.ComponentSchema {
  collectionName: 'components_shared_bank_accounts';
  info: {
    displayName: 'Bank Account';
    icon: 'briefcase';
  };
  attributes: {
    icon: Schema.Attribute.Enumeration<['Globe', 'Building']> &
      Schema.Attribute.DefaultTo<'Building'>;
    rows: Schema.Attribute.Component<'shared.bank-account-row', true>;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface SharedBankAccountRow extends Struct.ComponentSchema {
  collectionName: 'components_shared_bank_account_rows';
  info: {
    displayName: 'Bank Account Row';
    icon: 'bulletList';
  };
  attributes: {
    canCopy: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    label: Schema.Attribute.String & Schema.Attribute.Required;
    value: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface SharedBankTransferSettings extends Struct.ComponentSchema {
  collectionName: 'components_shared_bank_transfer_settings';
  info: {
    displayName: 'Bank Transfer Settings';
    icon: 'bank';
  };
  attributes: {
    bankAccounts: Schema.Attribute.Component<'shared.bank-account', true>;
    image: Schema.Attribute.Media<'images'>;
    title: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'Prefer a bank transfer?'>;
  };
}

export interface SharedBulletPoint extends Struct.ComponentSchema {
  collectionName: 'components_shared_bullet_points';
  info: {
    description: 'A single bullet point text';
    displayName: 'Bullet Point';
    icon: 'bulletList';
  };
  attributes: {
    text: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface SharedFormLabels extends Struct.ComponentSchema {
  collectionName: 'components_shared_form_labels';
  info: {
    displayName: 'Form Labels';
    icon: 'align-justify';
  };
  attributes: {
    amountLabel: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'Select Amount'>;
    currencyLabel: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'Currency'>;
    designationLabel: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'Designation'>;
    donorInfoLabel: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'Donor Information'>;
    emailLabel: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'Email Address'>;
    emailPlaceholder: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'e.g. john@example.com'>;
    formTitle: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'Make a Contribution'>;
    frequencyLabel: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'Frequency'>;
    fullNameLabel: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'Full Name'>;
    fullNamePlaceholder: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'e.g. John Doe'>;
    monthlyLabel: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'Monthly'>;
    oneTimeLabel: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'One-time'>;
    phoneLabel: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'Phone Number'>;
    secureInfoText: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'Your donation is processed securely.'>;
    submitButtonLabel: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'Pledge Donation'>;
  };
}

export interface SharedPatron extends Struct.ComponentSchema {
  collectionName: 'components_shared_patrons';
  info: {
    description: 'A patron for the Wall of Gratitude';
    displayName: 'Patron';
  };
  attributes: {
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    quote: Schema.Attribute.Text &
      Schema.Attribute.Required &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
  };
}

export interface SharedStringItem extends Struct.ComponentSchema {
  collectionName: 'components_shared_string_items';
  info: {
    displayName: 'String Item';
    icon: 'bold';
  };
  attributes: {
    value: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface SharedTag extends Struct.ComponentSchema {
  collectionName: 'components_shared_tags';
  info: {
    description: 'Article hashtag or topic tag';
    displayName: 'Tag';
    icon: 'price-tag';
  };
  attributes: {
    name: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface SharedTargetedGivingSettings extends Struct.ComponentSchema {
  collectionName: 'components_shared_targeted_giving_settings';
  info: {
    displayName: 'Targeted Giving Settings';
    icon: 'bullseye';
  };
  attributes: {
    goalLabel: Schema.Attribute.String & Schema.Attribute.DefaultTo<'goal'>;
    raisedLabel: Schema.Attribute.String & Schema.Attribute.DefaultTo<'raised'>;
    subtitle: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'Choose a specific area to support, and see exactly how your contribution builds the future.'>;
    title1: Schema.Attribute.String & Schema.Attribute.DefaultTo<'Where Your'>;
    title2: Schema.Attribute.String & Schema.Attribute.DefaultTo<'Gift Goes'>;
  };
}

export interface SharedWallOfGratitude extends Struct.ComponentSchema {
  collectionName: 'components_shared_wall_of_gratitudes';
  info: {
    description: 'Settings for the Wall of Gratitude section';
    displayName: 'Wall of Gratitude Settings';
  };
  attributes: {
    patrons: Schema.Attribute.Component<'shared.patron', true> &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    subtitle: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }> &
      Schema.Attribute.DefaultTo<'May Allah reward all those who support the pursuit of beneficial knowledge.'>;
    title: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }> &
      Schema.Attribute.DefaultTo<'Wall of Gratitude'>;
  };
}

declare module '@strapi/strapi' {
  export namespace Public {
    export interface ComponentSchemas {
      'about.certificate-item': AboutCertificateItem;
      'about.timeline-milestone': AboutTimelineMilestone;
      'about.value-item': AboutValueItem;
      'about.why-choose-item': AboutWhyChooseItem;
      'academic.approach-item': AcademicApproachItem;
      'academic.pathway-step': AcademicPathwayStep;
      'contact.campus-info': ContactCampusInfo;
      'contact.contact-form': ContactContactForm;
      'contact.social-media': ContactSocialMedia;
      'erp.behavior-record': ErpBehaviorRecord;
      'erp.enrollment-record': ErpEnrollmentRecord;
      'erp.medical-record': ErpMedicalRecord;
      'erp.staff-note': ErpStaffNote;
      'erp.timeline-item': ErpTimelineItem;
      'home.activity-card': HomeActivityCard;
      'home.hero-slide': HomeHeroSlide;
      'home.testimonial-item': HomeTestimonialItem;
      'login.feature-item': LoginFeatureItem;
      'navigation.mega-menu-item': NavigationMegaMenuItem;
      'navigation.menu-item': NavigationMenuItem;
      'sections.about-certificates': SectionsAboutCertificates;
      'sections.about-director': SectionsAboutDirector;
      'sections.about-intro': SectionsAboutIntro;
      'sections.about-mission-vision': SectionsAboutMissionVision;
      'sections.about-timeline': SectionsAboutTimeline;
      'sections.about-values': SectionsAboutValues;
      'sections.about-why-choose': SectionsAboutWhyChoose;
      'sections.cta-banner': SectionsCtaBanner;
      'sections.departments-grid': SectionsDepartmentsGrid;
      'sections.donation-banner': SectionsDonationBanner;
      'sections.events-grid': SectionsEventsGrid;
      'sections.feature-cards': SectionsFeatureCards;
      'sections.gallery-preview': SectionsGalleryPreview;
      'sections.hero': SectionsHero;
      'sections.news-featured-event': SectionsNewsFeaturedEvent;
      'sections.news-grid': SectionsNewsGrid;
      'sections.newsletter-signup': SectionsNewsletterSignup;
      'sections.principal-welcome': SectionsPrincipalWelcome;
      'sections.programs-grid': SectionsProgramsGrid;
      'sections.sponsors-grid': SectionsSponsorsGrid;
      'sections.stats': SectionsStats;
      'sections.testimonials-slider': SectionsTestimonialsSlider;
      'seo.meta': SeoMeta;
      'shared.bank-account': SharedBankAccount;
      'shared.bank-account-row': SharedBankAccountRow;
      'shared.bank-transfer-settings': SharedBankTransferSettings;
      'shared.bullet-point': SharedBulletPoint;
      'shared.form-labels': SharedFormLabels;
      'shared.patron': SharedPatron;
      'shared.string-item': SharedStringItem;
      'shared.tag': SharedTag;
      'shared.targeted-giving-settings': SharedTargetedGivingSettings;
      'shared.wall-of-gratitude': SharedWallOfGratitude;
    }
  }
}
