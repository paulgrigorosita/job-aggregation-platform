export interface CustomQA {
  question: string; // substring to match against form question/label text (case-insensitive)
  answer: string; // text to type, or option text to select/check
}

export interface ApplicationAnswers {
  preferredFirstName?: string;
  locationCity?: string;
  zipCode?: string;
  linkedinProfile?: string;
  howHeardAboutUs?: string;
  workAuthorized?: string; // e.g. "Yes" / "No"
  requireSponsorship?: string; // e.g. "Yes" / "No"
  genderIdentity?: string;
  transgender?: string;
  sexualOrientation?: string;
  raceEthnicity?: string;
  veteranStatus?: string;
  disability?: string;
  firstGenProfessional?: string;
  coverLetter?: string;
  customAnswers?: CustomQA[];
}

export const APPLICATION_ANSWER_FIELDS: Array<{ key: keyof ApplicationAnswers; label: string; questionPattern: string }> = [
  { key: 'preferredFirstName', label: 'Preferred First Name', questionPattern: 'preferred (first )?name' },
  { key: 'locationCity', label: 'Location (City)', questionPattern: 'location.*\\(?city\\)?|^city$' },
  { key: 'zipCode', label: 'Zip / Postal Code', questionPattern: 'zip|postal code' },
  { key: 'linkedinProfile', label: 'LinkedIn Profile', questionPattern: 'linkedin' },
  { key: 'howHeardAboutUs', label: 'How did you hear about this opportunity?', questionPattern: 'how did you (hear|find out|learn)' },
  { key: 'workAuthorized', label: 'Are you legally authorized to work in the country where you are applying?', questionPattern: 'authorized to work' },
  { key: 'requireSponsorship', label: 'Will you now or in the future require visa sponsorship?', questionPattern: 'sponsorship' },
  { key: 'genderIdentity', label: 'Gender identity', questionPattern: 'gender identity' },
  { key: 'transgender', label: 'I identify as transgender', questionPattern: 'transgender' },
  { key: 'sexualOrientation', label: 'Sexual orientation', questionPattern: 'sexual orientation' },
  { key: 'raceEthnicity', label: 'Race / ethnicity', questionPattern: 'race|ethnicity' },
  { key: 'veteranStatus', label: 'Veteran status', questionPattern: 'veteran' },
  { key: 'disability', label: 'Disability', questionPattern: 'disability' },
  { key: 'firstGenProfessional', label: 'First-generation professional', questionPattern: 'first.generation' },
  { key: 'coverLetter', label: 'Cover Letter (manual entry)', questionPattern: 'cover letter' },
];
