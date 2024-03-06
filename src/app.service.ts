import { Injectable } from '@nestjs/common';
import { PrismaService } from './db/prisma.service';
import { ContactResponseDto } from './response.dto';

@Injectable()
export class AppService {
  constructor(private readonly prisma: PrismaService) {}
  getHealth(): string {
    return 'Ok From Server';
  }

  async identify(email?: string, phoneNumber?: string) {
    const allContacts = await this.prisma.contact.findMany({
      where: {
        OR: [
          {
            email: email,
          },
          {
            phoneNumber: phoneNumber,
          },
        ],
      },
    });
    const primaryContacts = allContacts.filter((x) => {
      return x.linkPrecedence === 'primary';
    });

    // First Contact (Primary)
    if (allContacts.length === 0) {
      const contact = await this.prisma.contact.create({
        data: {
          phoneNumber: phoneNumber,
          email: email,
          linkPrecedence: 'primary',
        },
      });
      const response: ContactResponseDto = {
        contact: {
          primaryContatctId: contact.id,
          emails: [contact.email],
          phoneNumbers: [contact.phoneNumber],
          secondaryContactIds: [],
        },
      };
      return response;
    }

    if (email && phoneNumber) {
      // Secondary Contact Creation
      const existingContact = allContacts.find((x) => {
        return x.email === email && x.phoneNumber === phoneNumber;
      });
      if (!existingContact) {
        const parentContact = primaryContacts.find((x) => {
          return x.email === email || x.phoneNumber === phoneNumber;
        });
        const contact = await this.prisma.contact.create({
          data: {
            phoneNumber: phoneNumber,
            email: email,
            linkPrecedence: 'secondary',
            linkedId: parentContact.id,
          },
        });
        allContacts.push(contact);
      }

      // Primary Contacts Turning Secondary
      const parentContacts = primaryContacts.filter((x) => {
        return x.email === email || x.phoneNumber === phoneNumber;
      });
      if (parentContacts.length === 2) {
        parentContacts.sort((a, b) => {
          return a.createdAt.getTime() - b.createdAt.getTime();
        });
        const indexOfUpdatedContact = allContacts.findIndex((x) => {
          return (
            x.email === parentContacts[1].email &&
            x.phoneNumber === parentContacts[1].phoneNumber
          );
        });
        allContacts[indexOfUpdatedContact].linkPrecedence = 'secondary';
        allContacts[indexOfUpdatedContact].linkedId = parentContacts[0].id;
      }
    }

    // Moving the primary contact to the beginning of the array
    const primaryContactIndex = allContacts.findIndex(
      (x) => x.linkPrecedence === 'primary',
    );
    const primaryContact = allContacts.splice(primaryContactIndex, 1)[0];
    allContacts.unshift(primaryContact);

    const response: ContactResponseDto = {
      contact: {
        primaryContatctId: primaryContact.id,
        emails: [...new Set(allContacts.map(x => x.email))],
        phoneNumbers: [...new Set(allContacts.map(x => x.phoneNumber))],
        secondaryContactIds: [
          ...allContacts
            .filter((x) => x.linkPrecedence === 'secondary')
            .map((x) => x.id),
        ],
      },
    };
    return response;
  }
}
