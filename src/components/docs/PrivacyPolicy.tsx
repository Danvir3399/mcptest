import React from 'react';

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="container-fluid py-4">
      <h1 className="mb-4">Privacy Policy</h1>
      <p className="lead">Your privacy is critically important to us. At mcptest.io, we have a few fundamental principles:</p>

      <div className="card my-4">
        <div className="card-body">
          <h5 className="card-title">Data Storage</h5>
          <p>
            All data you enter and generate while using mcptest.io, including server URLs, connection history, tool parameters, and logs, is stored exclusively in your web browser's <strong>local storage</strong>.
          </p>
          <div className="alert alert-success">
            <strong>We do not collect, transmit, or store any of your application data on our servers.</strong> Your information remains on your machine.
          </div>
          <p>
            Your application data, including server connections and history, is stored only in your browser's local storage. No data is gathered or stored on our servers.
          </p>
          <p>
            Because data is stored locally, clearing your browser's cache or local storage will permanently delete your saved connections and history.
          </p>
          <p>
            The one exception is the site assistant, described below: questions you type into it are sent to the chat service.
          </p>
        </div>
      </div>

      <div className="card my-4" id="site-assistant">
        <div className="card-body">
          <h5 className="card-title">Site Assistant</h5>
          <p>
            Most pages show an <strong>Ask</strong> button that opens a chat assistant. It answers questions from this site's pages and is provided by the solv.chat service. Until you press the button, nothing is loaded from solv.chat, nothing is sent to it and nothing is stored in your browser.
          </p>
          <p>Once you open the assistant:</p>
          <ul>
            <li>The questions you type and the answers you get are stored by the chat service, so that we can see what visitors ask and improve the site's content. The address of the page you asked from is sent with each question.</li>
            <li>A random identifier is kept in your browser's local storage to keep one conversation together. The open conversation is also kept in session storage, which your browser clears when you close the tab.</li>
            <li>Your messages are processed by the model providers the service uses: Anthropic for answers and OpenAI for search embeddings.</li>
          </ul>
          <div className="alert alert-warning">
            <strong>Do not type personal or confidential information into the assistant</strong>, such as names, email addresses, credentials, tokens or private server URLs.
          </div>
        </div>
      </div>

      <div className="card my-4">
        <div className="card-body">
          <h5 className="card-title">Website Analytics</h5>
          <p>
            Like most website operators, mcptest.io may collect non-personally-identifying information of the sort that web browsers and servers typically make available, such as the browser type, language preference, referring site, and the date and time of each visitor request. Our purpose in collecting non-personally identifying information is to better understand how our visitors use the website.
          </p>
          <p>
            We also record product events, such as viewing a guide, starting a connection, generating a report or copying a badge, to learn which pages lead to a working connection. These events carry the server's host name at most. They never include full endpoint URLs, query strings, headers, tokens, credentials or anything you type.
          </p>
          <p>
            <strong>Do Not Track and Global Privacy Control are honored.</strong> If your browser sends either signal, mcptest.io does not load analytics and sends no page views or product events.
          </p>
        </div>
      </div>
      
      <div className="card my-4">
        <div className="card-body">
            <h5 className="card-title">Contact Us</h5>
            <p>If you have any questions about this Privacy Policy, please contact us by email: <a href="mailto:info@mcptest.io">info@mcptest.io</a></p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;