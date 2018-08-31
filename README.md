<h1>Microbit Wifi Package for ESP8266 module</h1>

<div>
	<h3>Introduction</h3>
	<p>ESP8266 is an approximately $5 wifi module, used in many tinkering projects to provide wifi to controller boards. This specific package is meant for Microsoft's PXT for Micro:bit and comes with a refined range of code blocks to make your life easier, especially since there is a lack of support at the moment for the ESP8266 on Micro:bit.</p>
	<p>It is not just meant to be a simple interface however, and features advanced features on different transport layers with different protocols to maximize the potential of this cheap but powerful Wifi module. The user can have precise control via the command queuing system, and higher up, good HTTP support with the request queuing system (WIP).</p>
	<p><b>So what are you waiting for? Dive right in!</b></p>
</div>

<div>
	<h3>Setup</h3>
	<ol>
		<li>Depending on your specific manufacturer, connect the ESP8266 module to the Microbit. I would strongly recommend TinkerTanker's Microbit Breakout board for this.</li>
		<li>If using <a href="http://makecode.microbit.org">Micro:bit Makecode Beta</a>, simply sign into Github on it after forking the package and you will be able to use it straight away.</li>
		<li>Else, follow the instructions <a href="https://makecode.microbit.org/offline">here</a>. Afterwards, clone the package and drop the contents into your project folder.</li>
	</ol>
</div>

<div>
	<h3>Documentation</h3>
	<p>Most, if not all, of the package contents are annotated with Javadocs. The Makecode IDE will automatically give hints based on that. In <b>main.ts</b> you will find a test usage too.</p>
	<p><b>DO NOTE: Both this package and original use Serial, meaning you cannot use it. I am working on a way to change that but it might be a while. </b></p>
</div>

<div>
	<h3>Changelog</h3>
	<p><b>I uploaded the package as soon as my test case worked using my framework so not everything here may be accurate.</b></p>
	<h4>Command Queue System</h4>
	<ul>
		<li>Created the Command object for this system, which allows blacklisting and whitelisting replies, giving commands a timeout, seeing rejected replies and much more in <b>command_queue.ts</b></li>
		<li>Instead of fixed delays, reply from ESP8266 is used to determine when next command can be sent. Saves time.</li>
		<li>Three functions to insert commands into the queue:
			<ul>
				<li><b>waitfor</b> blocks till the command replies. </li>
				<li><b>command</b> sends a command and forgets about it. </li>
				<li><b>request</b> sends a command and returns an ID that can be used to find it via <b>retrieve</b> or <b>check</b></li>
			</ul>
		</li>
	</ul>
	<h4>Minor</h4>
	<ul>
		<li>Allowed user to change wifi mode (client,hotspot both) for ESP8266. Created <b>wifiMode</b> as a enum for it.</li>
		<li>Exposed multiple simultanous connections. Created <b>connectionSlot</b> as a enum for it.</li>
		<li>Came up with a way to debug it. (Involves two Microbits and the Radio Package)</li>
		<li>Split code into multiple files for neatness.</li>
		<li>Javadocs and comments, everywhere.</li>
	</ul>
</div>
<div>
	<h3>Plans</h3>
	<ul>
		<li>More bug testing.</li>
		<li>firmware compatibility testing. Most commands probably worked but I am using <a href="http://wiki.aprbrother.com/en/Firmware_For_ESP8266.html">ai-thinker-0.9.5.2-9600.bin</a>.</li>
		<li>Support POST requests.</li>
		<li>Create the request queue system now that I know how to write a proper HTTP request and how to circumvent the Serial buffer limit.</li>
		<li>Some replies that don't come after commands have useful information.</li>
		<li>Expose uBit.serial so as to have multiple serial streams and not block serial.</li>
		<li>Expose hotspot mode with functions.</li>
		<li>Figure out the UDP protocol.</li>
		<li>Have a server mode.</li>
		<li>Have a mesh network mode.</li>
	</ul>
</div>
<div>
	<h3>Credits</h3>
	<p>The <a href="https://github.com/elecfreaks/pxt-esp8266iot">original ESP8266 package</a> was developed under the cooperation of [ELECFREAKS](https://www.elecfreaks.com/), [CLASSROOM](http://www.classroom.com.hk/) and [TINKERCADEMY](https://tinkercademy.com/). </p>
	<p>This iteration is made mainly by Interpause@Github, a intern at Tinkercademy tasked to improve it. It is however a total revamp inspired by the original package because he is "perfectionist" to say the least. </p>
	<p>I am really thankful to my mentor, Mr Soon, and my colleagues at TinkerTanker for being accommodating, and occasionally helping with debugging when I was stuck. </p>
	<p>The license for this package is the same as the original (MIT), I especially hope users can expand upon the groundwork I tried my best to lay well. </p>
</div>