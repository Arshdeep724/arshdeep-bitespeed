export class ContactDto {
  primaryContatctId: number;
  emails: string[];
  phoneNumbers: string[];
  secondaryContactIds: number[];
}

export class ContactResponseDto {
  contact: ContactDto;
}