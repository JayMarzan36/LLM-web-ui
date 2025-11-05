function chatWindow(messages) {

    let formatted_messages = []
    if (messages.length > 0) {
        for (message of messages) {
            let content = "";
            if (message !== "" && message.trim() !== "") {
                content += <p>{message.trim()}</p>;
            }
    
            if (message.code && message.code.trim() !== "") {
                const code_lines = message.code.split('\n').map((line, index) => (
                    <div key={index}>
                        <pre><code>{line}</code></pre>
                    </div>
                ));
    
                content += code_lines
            }
            formatted_messages.push(content);
        }
    }



    return (
        <>
            <div className="chat-history">
                {formatted_messages.map((message) => (
                    <div key={message.content} className={`chat-message ${message.type}`}>
                        {message.content}
                    </div>
                ))}
            </div>
        
        </>
    );

}