with (Hasher.Controller('Whois','Application')) {

  route({
    '#account/profiles': 'index'
  });
  
  create_action('index', function() {
    BadgerCache.getContacts(function(results) {
      render('index', results.data);
    });
  });
  
  create_action('create_or_update_whois', function(contact_id, callback, form_data) {
    $('#errors').empty();

    var tmp_callback = function(response) {
      if (response.meta.status == 'ok') {
        BadgerCache.flush('contacts');
        BadgerCache.getContacts(function() {
          if (callback) {
            callback();
          } else {
            call_action('Modal.hide');
            call_action('index');
          }
        });
      } else {
        $('#errors').empty().append(helper('Application.error_message', response));
      }
    }

    if (contact_id) {
      Badger.updateContact(contact_id, form_data, tmp_callback);
    } else {
      Badger.createContact(form_data, tmp_callback);
    }
  });
  
  layout('dashboard');
}

with (Hasher.View('Whois', 'Application')) { (function() {

  create_view('index', function(contacts) {
    return div(
      h1('Profiles'),
      div({ style: 'float: right; margin-top: -44px' }, 
        a({ 'class': 'myButton myButton-small', href: action('Modal.show', 'Whois.edit_whois_modal') }, 'Create New Profile')
      ),

      table({ 'class': 'fancy-table' },
        tbody(
          (contacts || []).map(function(contact) {
            return tr(
              td(
                div(contact.first_name, ' ', contact.last_name),
                div(contact.organization)
              ),
              td(
                div(contact.email),
                div(contact.phone),
                div(contact.fax)
              ),
              td(
                div(contact.address),
                div(contact.address2),
                div(contact.city, ', ', contact.state, ', ', contact.zip),
                div(contact.country)
              ),
              td({ style: "text-align: right" },
                a({ 'class': 'myButton myButton-small', href: action('Modal.show', 'Whois.edit_whois_modal', contact) }, 'Edit')
              )
            );
          })
        )
      )
    );
  });

  create_helper('whois_contact', function(whois) {
    return div(
      div(whois.first_name, ' ', whois.last_name),
      (whois.organization && div(whois.organization)),
      (whois.address && div(whois.address)),
      (whois.address2 && div(whois.address2)),
      div(whois.city, ', ', whois.state, ', ', whois.zip, ', ', whois.country),
      div('Email: ', whois.email),
      div('Phone: ', whois.phone),
      (whois.phone && div('Fax: ', whois.phone))
    );
  });
  
  create_helper('edit_whois_modal', function(data, callback) {
    data = data || {};
    return form({ action: action('create_or_update_whois', data.id, callback) },
      h1(data.id ? 'Edit Profile' : 'Create Profile'),
      div({ id: 'errors' }),

      p("This information will ", strong('automatically be private'), " unless you install ", i('Public Whois'), " on a domain."),
      
      table({ style: 'width: 100%' }, tbody(
        tr(
          td({ style: 'width: 50%; vertical-align: top' },
            h3({ style: 'margin: 0' }, 'Contact Information'),
            div(
              input({ style: 'width: 110px', name: 'first_name', placeholder: 'First Name', value: data.first_name || '' }),
              input({ style: 'width: 110px', name: 'last_name', placeholder: 'Last Name', value: data.last_name || '' })
            ),
            div(input({ style: 'width: 200px', name: 'organization', placeholder: 'Organization (optional)', value: data.organization || '' })),
            div(input({ style: 'width: 200px', name: 'email', placeholder: 'Email', value: data.email || '' })),
            div(
              input({ style: 'width: 90px', name: 'phone', placeholder: 'Phone', value: data.phone || '' }),
              input({ style: 'width: 90px', name: 'fax', placeholder: 'Fax (optional)', value: data.fax || '' })
            )
          ),
          td({ style: 'width: 50%; vertical-align: top' },
            h3({ style: 'margin: 0' }, 'Mailing Address'),
            div(
              input({ style: 'width: 200px', name: 'address', placeholder: 'Address Line 1', value: data.address || '' })
            ),
            div(
              input({ style: 'width: 200px', name: 'address2', placeholder: 'Address Line 2 (Optional)', value: data.address2 || '' })
            ),
            div(
              input({ style: 'width: 100px', name: 'city', placeholder: 'City', value: data.city || '' }),
              input({ style: 'width: 40px', name: 'state', placeholder: 'State', value: data.state || '' }),
              input({ style: 'width: 50px', name: 'zip', placeholder: 'Zip', value: data.zip || '' })
            ),
            div(
              select({ style: 'width: 150px', name: 'country' }, option({ disabled: 'disabled' }, 'Country:'), helper("Application.country_options", data.country))
            )
          )
        )
      )),

      div({ style: 'text-align: center; margin-top: 10px' }, input({ 'class': 'myButton', type: 'submit', value: data.id ? 'Save Profile' : 'Create Profile' }))
    );
  });
})(); }