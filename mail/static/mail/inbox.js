// DATA
const tabs = ['inbox', 'sent', 'archive'];
let currentTab = '';

// TEMPLATES
const emailPageTemplate = (mailbox) => `
  <h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>
  <div id="emails-container" class="d-flex flex-column" style="gap: 4px;">Loading...</div>
`

const emailRowTemplate = (email) => `
  <div
    class="email-row d-flex align-items-center justify-content-between border border-secondary p-2 ${email.read ? 'bg-light': 'bg-white'}"
    style="cursor: pointer;"
    data-id="${email.id}"
  >
    <div class="d-flex align-items-center" style="gap:8px;">
      <span class="${email.read ? 'font-weight-medium': 'font-weight-bold'}" style="font-size: 14px;">
        ${email.sender}
      </span>
      <span class="font-weight-medium" style="font-size: 12px;">
        ${email.subject}
      </span>
    </div>
    <div class="" style="font-size: 14px;">${email.timestamp}</div>
  </div>
`

const emailTemplate = (email, isSent) => `
  <div class="d-flex flex-column align-items-start justify-content-center p-2">
    <span class="" style="font-size: 16px;">
      <strong>From:</strong> ${email.sender}
    </span>
    <span class="" style="font-size: 16px;">
      <strong>To:</strong> ${email.recipients}
    </span>
    <span class="font-weight-medium" style="font-size: 16px;">
      <strong>Subject:</strong> ${email.subject}
    </span>
    <span class="" style="font-size: 16px;">
      <strong>Timestamp:</strong> ${email.timestamp}
    </span>
  </div>
  <hr>
  <div class="p-2">
    <p>${email.body}</p>
  </div>
  ${ isSent ? ''
    : `
    <div class="d-flex justify-content-end" style="gap: 8px;">
      <button id="reply" class="btn btn-outline-primary">Reply</button>
      <button id="archive-email" class="btn btn-outline-primary">${email.archived ? 'Unarchive' : 'Archive'}</button>
    </div>
    `
  }
`;

// SERVICES
const getEmails = async (mailbox) => {
  if(!tabs.includes(mailbox)) {
    return;
  }

  try {
    const response = await fetch(`/emails/${mailbox}`);
    const emails = await response.json();
    
    return emails;
  } catch (e) {
    console.error(e);
  }
  
}

const getSingleEmail = async (emailId) => {
  try {
    const response = await fetch(`/emails/${emailId}`);
    const email = await response.json();
    
    return email;
  } catch (e) {
    console.error(e);
  }
}

const postEmail = async (recipients, subject, body) => {
  const strRecipients = recipients.split(',').map(recipient => recipient.trim()).join(',');

  try {
    const response = await fetch('/emails', {
      method: 'POST',
      body: JSON.stringify({
          recipients: strRecipients,
          subject: subject,
          body: body
      })
    });
    const result = await response.json();
    
    if (response.status !== 201) {
      throw new Error(result.error);
    }

    return true;
  } catch (e) {
    console.error(e);

    return false
  }
}

const archiveEmail = async (archived, emailId) => {
  try {
    const response = await fetch(`/emails/${emailId}`, {
      method: 'PUT',
      body: JSON.stringify({
          archived
      })
    });
    
    if (response.status !== 204) {
      throw new Error(result.error);
    }

    return true;
  } catch (e) {
    console.error(e);

    return false
  }
}

const readEmail = async (emailId) => {
  try {
    const response = await fetch(`/emails/${emailId}`, {
      method: 'PUT',
      body: JSON.stringify({
          read: true
      })
    });
    
    if (response.status !== 204) {
      throw new Error(result.error);
    }

    return true;
  } catch (e) {
    console.error(e);

    return false
  }
}


// COMMON ACTIONS
const openInboxView = () => {
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#single-email-view').style.display = 'none';
}

const openEmailView = () => {
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#single-email-view').style.display = 'block';
}

const highlightComposeBtn = () => {
  tabs.forEach(tab => {
    const btn = document.querySelector(`#${tab}`);

    btn.className = btn.className.replace(' btn-primary', ' btn-outline-primary');
  });

  const composeBtn = document.querySelector('#compose');

  composeBtn.className = composeBtn.className.replace(' btn-outline-primary', ' btn-primary');
}

const clearAllHighlights = () => {
  tabs.forEach(tab => {
    const btn = document.querySelector(`#${tab}`);

    btn.className = btn.className.replace(' btn-primary', ' btn-outline-primary');
  });

  const composeBtn = document.querySelector('#compose');

  composeBtn.className = composeBtn.className.replace(' btn-primary', ' btn-outline-primary');
}


// LOGIC
document.addEventListener('DOMContentLoaded', async () => {
  // Use buttons to toggle between views
  tabs.forEach(tab => {
    const btn = document.querySelector(`#${tab}`);

    btn.addEventListener('click', async () => {
      btn.disabled = true;

      await loadMailbox(tab);

      btn.disabled = false;
    });
  });

  document.querySelector('#compose').addEventListener('click', composeEmail);

  document.querySelector('#compose-form').addEventListener('submit', async (event) => {
    event.preventDefault();

    await sendEmail();
  });

  // By default, load the inbox
  await loadMailbox('inbox');
});


const loadMailbox = async (mailbox) => {
  if(!tabs.includes(mailbox) || currentTab === mailbox) {
    return;
  }

  currentTab = mailbox;

  // Show the mailbox
  document.querySelector('#emails-view').innerHTML = emailPageTemplate(mailbox);

  openInboxView();

  tabs.forEach(tab => {
    const btn = document.querySelector(`#${tab}`);

    if (tab === currentTab) {
      btn.className = btn.className.replace(' btn-outline-primary', ' btn-primary');

      return;
    }
    
    btn.className = btn.className.replace(' btn-primary', ' btn-outline-primary');

    const composeBtn = document.querySelector('#compose');

    composeBtn.className = composeBtn.className.replace(' btn-primary', ' btn-outline-primary');
  });
  
  const emails = await getEmails(mailbox);

  // Show the mailbox and hide other views
  const emailsContainer = document.querySelector('#emails-container');

  // Handle errors
  if(!Array.isArray(emails)) {
    
    emailsContainer.innerHTML = 'Not possible to fetch emails.'

    return;
  }

  if (emails.length === 0) {
    emailsContainer.innerHTML = 'No email found.'

    return;
  }

  // Clear emails

  emailsContainer.innerHTML = '';

  // Populate emails
  emails.reduce((acc, email) => {
    acc.innerHTML += emailRowTemplate(email);

    return acc;
  }, emailsContainer);

  document.querySelectorAll('.email-row').forEach(emailRow => {
    emailRow.addEventListener('click', async () => {
      const emailId = emailRow.dataset.id;

      await openEmail(emailId);
    });
  });
}

const composeEmail = () => {

  currentTab = 'compose';

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#single-email-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  highlightComposeBtn();

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
  document.querySelector('#error-message')?.remove();
}

const sendEmail = async () => {
  const recipients = document.querySelector('#compose-recipients').value;
  const subject = document.querySelector('#compose-subject').value;
  const body = document.querySelector('#compose-body').value;

  const result = await postEmail(recipients, subject, body);

  if (!result) {
    if (!document.querySelector('#error-message')) {
      const errorParagraph = document.createElement('p')
      errorParagraph.id = 'error-message';
      errorParagraph.className = 'text-danger';
      errorParagraph.innerHTML = 'Not possible to send email. Check if the fields are correct';

      document.querySelector('#compose-form').append(errorParagraph);
    }

    return;
  }

  await loadMailbox('sent');
}

const openEmail = async (emailId) => {
  const email = await getSingleEmail(emailId);

  if (!email) {
    return;
  }

  // Show the mailbox
  const isSent = currentTab === 'sent';

  document.querySelector('#single-email-view').innerHTML = emailTemplate(email, isSent);

  openEmailView();

  currentTab = 'email';

  clearAllHighlights();

  if (!isSent) {
    document.querySelector('#reply').addEventListener('click', () => replyEmail(email));
    document.querySelector('#archive-email').addEventListener('click', async () => {
      const result = await archiveEmail(!email.archived, email.id);

      if (!result) {
        return;
      }

      await loadMailbox('inbox');
    });

    if (!email.read) {
      await readEmail(email.id);
    }
  }
}

const replyEmail = (email) => {
  const recipients = email.sender;
  const subject = email.subject.includes('Re:') ? email.subject : `Re: ${email.subject}`;
  const body = `On ${email.timestamp} ${email.sender} wrote: ${email.body}`;

  composeEmail();

  document.querySelector('#compose-recipients').value = recipients;
  document.querySelector('#compose-subject').value = subject;
  document.querySelector('#compose-body').value = body;
}

