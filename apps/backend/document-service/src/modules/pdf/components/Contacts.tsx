import type { ReactElement } from 'react';
import type { PdfContacts } from '@pawhaven/shared/types';

export interface ContactsProps {
  contacts: PdfContacts | undefined;
}

export const Contacts = ({ contacts }: ContactsProps): ReactElement => (
  <>
    {contacts?.items?.length ? (
      <section className="border-orange-3 bg-orange-1 mx-10 mb-5 break-inside-avoid rounded-lg border px-5 py-4">
        <h3 className="text-label tracking-label text-orange-9 mb-2.5 font-bold uppercase">
          {contacts.title}
        </h3>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
          {contacts.items.map((contact, contactIndex) => (
            <div
              key={`contact-${contactIndex}`}
              className="border-orange-2 bg-brown-1 flex flex-col gap-0.5 rounded-md border px-2.5 py-2"
            >
              <span className="text-fineprint tracking-print text-yellow-8 font-semibold uppercase">
                {contact.label}
              </span>
              <span className="text-label text-orange-10 font-bold">
                {contact.value}
              </span>
            </div>
          ))}
        </div>
      </section>
    ) : null}
  </>
);
