with (Hasher.Controller('Signup','Application')) {
  route({
    '#request_invite': 'request_invite',
    '#register/:code': 'register',
    '#register_terms_of_service': 'register_terms_of_service',
    '#confirm_email/:code': 'confirm_email',
    '#login': 'login'
  });

  //skip_before_filter('redirect_to_root_unless_logged_in');

  create_action('request_invite', function() {
    render('request_invite');
    $('#email-address').focus();
  });

  create_action('submit_invite_request', function() {
    Badger.requestInvite($('#email-address').val(), function(response) {
      console.log(response)
      if (response.meta.status == 'ok') {
        render('request_invite_extra_info', response.data.invite_request_id);
      } else {
        render('request_invite');
        $('#signup-errors').empty().append(helper('Application.error_message', response));
      }
    });
    render('request_invite_processing');
  });

  create_action('submit_invite_request_extra_info', function(data) {
    if (data.full_name == "" || data.total_domains_registered == "")
      return $('#extra-information-errors').empty().append(helper('Application.error_message', { data: { message: "Full name or number of domains registered can not be empty" }}));

    Badger.requestInviteExtraInfo(data, function(response) {
      console.log(response)
      if (response.meta.status == 'ok') {
        render('request_invite_thanks');
      } else {
        render('request_invite_extra_info', data.invite_request_id);
        $('#extra-information-errors').empty().append(helper('Application.error_message', response));
      }
    });
    render('request_invite_processing');
  });

  create_action('process_login', function(form) {
    $('#signup-errors').empty();
    Badger.login(form.email, form.password, function(response) {
      if (response.meta.status == 'ok') {
        if (Badger.back_url != "") {
          redirect_to(Badger.back_url);
          Badger.back_url = "";
        } else {
          redirect_to('#');
        }
      } else {
        $('#signup-errors').empty().append(helper('Application.error_message', response));
      }
    });
  });

  create_action('register', function(code) {
    render('register', code);

    Badger.createAccount({ invite_code: code }, function(response) {
      if (response.data.message == 'Invite code not available') {
        alert('Sorry, this invite code is no longer available!');
        redirect_to('#');
      }
    });
  });

  create_action('create_person', function(data) {
		if(data.password != data.confirm_password) {
			$('#signup-errors').empty().append(helper('Application.error_message', { data: { message: "Passwords do not match" } }));
      return;
		}
    // if (!data.agree_to_terms) {
    //   $('#signup-errors').empty().append(helper('Application.error_message', { data: { message: "You must accept terms of service to use our site" } }));
    //   return;
    // }
    Badger.createAccount(data, function(response) {
      if (response.meta.status == 'ok') {
        redirect_to('#');
        setTimeout(function() { call_action('Modal.show', 'SiteTour.site_tour_0'); }, 250);
      } else {
        $('#signup-errors').empty().append(helper('Application.error_message', response));
      }
    });
  });

	create_action('send_password_reset_email', function(callback, form_data) {
		Badger.sendPasswordResetEmail(form_data, function(response) {
			if (response.meta.status == 'ok') {
        call_action('Modal.show', 'Signup.reset_password_modal', form_data);
			} else {
				$('#forgot-password-messages').empty().append(helper('Application.error_message', response));
			}
		});
	});

	create_action('reset_password', function(callback, form_data) {
		if(form_data.new_password != form_data.confirm_password)
			return $('#reset-password-messages').empty().append( helper('Application.error_message', { data: { message: "Passwords do not match" } }) );

		Badger.resetPasswordWithCode(form_data, function(response) {
			if (response.meta.status == 'ok')
			{
				$('#reset-password-messages').empty().append(helper('Application.success_message', response));
				$('#reset-password-form').empty();
			}
			else
			{
				$('#reset-password-messages').empty().append(helper('Application.error_message', response));
			}
		});
	});

	create_action('confirm_email', function(code) {
		Badger.confirmEmail(code, function(response) {
       call_action('Modal.show', 'Signup.confirm_email_notification', response.data, response.meta.status);
		});
    redirect_to('#');
	});

  create_action('register_terms_of_service', function() {
    render(helper('TermsOfService.terms_of_service'));
  });

  layout('signup');
}

with (Hasher.View('Signup', 'Application')) { (function() {

  create_view('request_invite', function() {
    return div({ id: 'signup-box' },
      h1('Badger.com'),
      h2("Thanks for visiting!  We're not quite ready yet but if you'd like an invite when we are, please enter your email address:"),

      div({ id: 'signup-errors' }),

      form({ style: 'text-align: center', action: action('submit_invite_request') },
        input({ type: 'text', id: 'email-address', placeholder: 'Your Email Address' }),
        input({ type: 'submit', value: 'Request Invite', 'class': "myButton" })
      )
    );
  });

  create_view('login', function() {
    return div({ id: 'signup-box' },
      h1('Login'),
      div({ id: 'signup-errors' }),
      form({ action: action('process_login') },
        input({ name: 'email', placeholder: 'Email Address' }),

        input({ name: 'password', type: 'password', placeholder: 'Password' }),

        input({ 'class': 'myButton', type: 'submit', value: 'Login' })
      ),
      div({ style: 'margin-top: 20px' },
				a({ href: action('Modal.show', 'Signup.forgot_password_modal') }, "Forgot your password?"), br(),
        a({ href: '#request_invite' }, "Don't have an account?")
      )
    );
  });

  create_view('request_invite_processing', function() {
    return div({ id: 'signup-box' },
      h3('Processing... please wait.')
    );
  });

  create_view('request_invite_extra_info', function(invite_request_id) {
    return div(
      h1('Extra Infomation'),
      div({ id: 'extra-information-errors' }),
      form({ action: action('submit_invite_request_extra_info') },
        input({ type: 'hidden', name: 'invite_request_id', value: invite_request_id }),

        div("What's your name?"),
        div(
          input({ name: 'full_name', 'class': 'invite-extra-info' })
        ),

        div("How many domains do you currently registered?"),
        div({ 'class': 'invite-extra-info' },
          div(
            input({ id: 'total_domains_0', type: 'radio', name: 'total_domains_registered', value: "0" }),
            label({ 'for': 'total_domains_0' }, "0")
          ),
          div(
            input({ id: 'total_domains_1_10', type: 'radio', name: 'total_domains_registered', value: "1-10" }),
            label({ 'for': 'total_domains_1_10' }, "1-10")
          ),
          div(
            input({ id: 'total_domains_11_50', type: 'radio', name: 'total_domains_registered', value: "11-50" }),
            label({ 'for': 'total_domains_11_50' }, "11-50")
          ),
          div(
            input({ id: 'total_domains_51_100', type: 'radio', name: 'total_domains_registered', value: "51-100" }),
            label({ 'for': 'total_domains_51_100' }, "51-100")
          ),
          div(
            input({ id: 'total_domains_101_250', type: 'radio', name: 'total_domains_registered', value: "101-250" }),
            label({ 'for': 'total_domains_101_250' }, "101-250")
          ),
          div(
            input({ id: 'total_domains_250_1000', type: 'radio', name: 'total_domains_registered', value: "250-1000" }),
            label({ 'for': 'total_domains_250_1000' }, "250-1000")
          ),
          div(
            input({ id: 'total_domains_1000', type: 'radio', name: 'total_domains_registered', value: "1000+" }),
            label({ 'for': 'total_domains_1000' }, "1000+")
          )
        ),

        div("Have any suggestion for us? (optional)"),
				div(
					textarea({ name: 'suggestions', 'class': 'invite-extra-info' })
				),

        div({ style: 'margin-top: 20px' }, input({ 'class': 'myButton', type: 'submit', value: 'Submit' }))
      )
    );
  });

  create_view('request_invite_thanks', function() {
    return div({ id: 'signup-box' },
      h3('Thanks!  We\'ll get back to you shortly!')
    );
  });

  create_view('register', function(code) {
    return div({ id: 'signup-box' },
      h1('Create Your Badger.com Account'),
      div({ id: 'signup-errors' }),
      form({ action: action('create_person') },
        input({ type: 'hidden', name: 'invite_code', value: code }),

        div(
          input({ name: 'first_name', placeholder: 'First Name' }),
          input({ name: 'last_name', placeholder: 'Last Name' })
        ),

        div(
          input({ name: 'email', size: 35, placeholder: 'Email Address' })
        ),

				div(
					input({ name: 'password', placeholder: 'Desired Password', type: 'password' }),
					input({ name: 'confirm_password', placeholder: 'Confirm Password', type: 'password' })
				),
        
        br(),
        div(
          input({ type: 'checkbox', name: 'agree_to_terms', id: 'agree_to_terms', value: true }),
          label({ 'for': 'agree_to_terms' }, ' I agree to the Badger.com '),
          a({ href: window.location.href.split('#')[0] + '#register_terms_of_service', target: '_blank' }, 'Terms of Service')
        ),
        div({ style: 'margin-top: 20px' }, input({ 'class': 'myButton', type: 'submit', value: 'Submit' }))
      )
    );
  });

	create_helper('reset_password_modal', function(data) {
		return div(
			form({ action: action('reset_password', data) },
				h1("Reset Password"),
				div({ id: 'reset-password-messages' }),
				div({ id: 'reset-password-form' },
					div({ style: 'margin: 20px 0; text-align: center' },
					  input({ name: "email", type: 'hidden', value: data.email }),
						input({ name: "code", placeholder: "Reset Code", value: data.code || '' }),
						input({ name: "new_password", type: 'password', placeholder: "New Password", value: data.new_password || '' }),
						input({ name: "confirm_password", type: 'password', placeholder: "Confirm New Password", value: data.confirm_password || '' }),
						input({ 'class': 'myButton myButton-small', type: 'submit', value: 'Update' })
					)
				)
			)
		);
	});

	create_helper('forgot_password_modal', function(data) {
		data = data || {};

		return div(
			form({ action: action('send_password_reset_email', data) },
				h1("Forgot Password"),
				div({ id: 'forgot-password-messages' }),
				div({ id: 'forgot-password-form', style: 'margin: 20px 0; text-align: center' },
					input({ name: "email", type: "text", 'class': 'fancy', size: 30, placeholder: "Email", value: data.email || '' }),
					input({ 'class': 'myButton', type: 'submit', value: 'Send Reset Code' })
				)
			)
		);
	});

  create_helper('confirm_email_notification', function(data, status) {
    return div(
      h1("Confirm Email Message"),
      status == 'ok' ? p(data.message + ". You can close this window now.") : p({ 'class':  'error-message'}, data.message),
      a({ href: action('Modal.hide'), 'class': 'myButton', value: "submit" }, "Close")
		);
	});

})(); }
