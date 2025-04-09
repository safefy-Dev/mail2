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

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;
  fetch(`/emails/${mailbox}`)
  .then(Response=>Response.json)
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
      if (email.read) {
        emailDiv.style.backgroundColor = '#f0f0f0';
      }
      emailDiv.addEventListener('click', () => load_email(email.id));
      document.querySelector('#emails-view').appendChild(emailDiv);
    });
});

}