import { DBResponse, ContactChartData } from './contacts.model';

function getUniqueContacts(sent: DBResponse[], received: DBResponse[]) {
  const sentContacts = sent.map((s) => s._id.contact_name);
  const receivedContects = received.map((r) => r._id.contact_name);

  const mergedContacts = [...sentContacts, ...receivedContects]
  const uniqueContacts = mergedContacts.filter((contact, index) => {
    return mergedContacts.indexOf(contact) >= index;
  });

  return uniqueContacts;
}

export const mergeContacts = (sent: DBResponse[], received: DBResponse[]) => {
  const merged: ContactChartData[] = [];
  const contacts = getUniqueContacts(sent, received);

  contacts.forEach((contact) => {
    let totalSentTexts = 0;
    let totalReceivedTexts = 0;
    let phoneNumber = '';

    sent.filter((s) => {
      const match: boolean = s._id.contact_name === contact;
      if (match) {
        totalSentTexts += s.totalTexts;
        phoneNumber = s._id.phone_number;
      }
      return match;
    });
    received.filter((r) => {
      const match: boolean = r._id.contact_name === contact;
      if (match) {
        totalReceivedTexts += r.totalTexts;
        phoneNumber = r._id.phone_number;
      }
      return match;
    });

    merged.push({
      contact: contact,
      phone: phoneNumber,
      values: [{
        label: 'Sent',
        value: totalSentTexts
      }, {
        label: 'Received',
        value: totalReceivedTexts
      }]
    });
  });
  return merged;
}