document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#email-detail-view').style.display = 'none';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';

  document.querySelector('form').onsubmit=function(event){
   event.preventDefault();
   const recipients=document.querySelector('#compose-recipients').value;
   const subject=document.querySelector('#compose-subject').value;
   const body=document.querySelector('#compose-body').value;

   fetch('/emails',{
    method:'POST',
    body: JSON.stringify({
      recipients:recipients,
      subject: subject,
      body: body
    }) 
   })
   .then(Response=>Response.json())
   .then(result=>{
    console.log(result);
    load_mailbox('sent');
  });
  };
  

}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-detail-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;
  fetch(`/emails/${mailbox}`)
  .then(response=>response.json())
  .then(emails=>{
    if (emails.length === 0){
      document.querySelector('#emails-view').innerHTML += `<p><em>No emails in ${mailbox}.</em></p>`;
        return; 
    }

    emails.forEach(email => {
      const emailDiv = document.createElement('div');
      emailDiv.className = 'email-item';
      emailDiv.innerHTML = `
        <strong>${email.sender}</strong> &nbsp;
        ${email.subject}
        <span style="float: right;">${email.timestamp}</span>
      `;
      emailDiv.addEventListener('click', () => {
        load_email(email.id);
      });
      
      if (email.read) {
        emailDiv.style.backgroundColor = '#f0f0f0';
      }
      emailDiv.addEventListener('click', () => load_email(email.id));
      document.querySelector('#emails-view').appendChild(emailDiv);
    });
  });

}

function load_email(id) {
  // Show the email view and hide others
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#email-detail-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';

  // Clear previous content
  const detailView = document.querySelector('#email-detail-view');
  detailView.innerHTML = '';

  // Fetch the email
  fetch(`/emails/${id}`)
    .then(response => response.json())
    .then(email => {
      // Mark as read
      if (!email.read) {
        fetch(`/emails/${id}`, {
          method: 'PUT',
          body: JSON.stringify({ read: true })
        });
      }

      // Build email view
      detailView.innerHTML = `
        <strong>From:</strong> ${email.sender}<br>
        <strong>To:</strong> ${email.recipients.join(', ')}<br>
        <strong>Subject:</strong> ${email.subject}<br>
        <strong>Timestamp:</strong> ${email.timestamp}<br><br>
        <button class="btn btn-sm btn-outline-primary" id="reply-button">Reply</button>
        <button class="btn btn-sm btn-outline-secondary" id="archive-button"></button>
        <hr>
        <p>${email.body.replace(/\n/g, '<br>')}</p>
      `;
      

      // Archive/Unarchive button
      const archiveBtn = document.querySelector('#archive-button');
      if (email.archived) {
        archiveBtn.textContent = 'Unarchive';
      } else {
        archiveBtn.textContent = 'Archive';
      }
      archiveBtn.addEventListener('click', () => {
        fetch(`/emails/${id}`, {
          method: 'PUT',
          body: JSON.stringify({ archived: !email.archived })
        }).then(() => load_mailbox('inbox'));
      });

      
      document.querySelector('#reply-button').addEventListener('click', () => {
        reply_email(email);
      });
    });
}

function reply_email(email) {
  // Show compose view
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#email-detail-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Pre-fill fields
  document.querySelector('#compose-recipients').value = email.sender;

  // Add "Re:" to subject if it doesn't already start with it
  let subject = email.subject;
  if (!subject.startsWith('Re:')) {
    subject = 'Re: ' + subject;
  }
  document.querySelector('#compose-subject').value = subject;

  // Format original message in body
  const quoted_body = `\n\nOn ${email.timestamp}, ${email.sender} wrote:\n${email.body}`;
  document.querySelector('#compose-body').value = quoted_body;
}
