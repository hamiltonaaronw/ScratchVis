#include "Graphics.h"

Graphics::Graphics()
{
	init();
}

void Graphics::init()
{
	glfwInit();
	glfwWindowHint(GLFW_CONTEXT_VERSION_MAJOR, 3);
	glfwWindowHint(GLFW_CONTEXT_VERSION_MINOR, 3);
	glfwWindowHint(GLFW_OPENGL_PROFILE, GLFW_OPENGL_CORE_PROFILE);

	mpAudio = new Audio();
	this->userSetup(SetupStage::MUSIC_DIR);

	this->userSetup(SetupStage::WINDOW);

	if (mpWindow == NULL)
	{
		std::cout << "Failed to create GLFW window" << std::endl;
		glfwTerminate();
		return;
	}
	glfwMakeContextCurrent(mpWindow);
	glfwSetFramebufferSizeCallback(mpWindow, Graphics::framebuffer_size_callback);

	// glad: load all OpenGL function pointers
	if (!gladLoadGLLoader((GLADloadproc)glfwGetProcAddress))
	{
		std::cout << "Failed to initialize GLAD" << std::endl;
		return;
	}

	this->addShader("Psychedelicious", 0, 0, 0, "Shaders/Vertex/basic_vert.vs", "Shaders/Fragment/tunnel_frag.fs", NULL);
	this->addShader("Retro", 0, 0, 0, "Shaders/Vertex/basic_vert.vs", "Shaders/Fragment/vintage_frag.fs", NULL);
	this->addShader("DiscoTHICC", 0, 0, 0, "Shaders/Vertex/basic_vert.vs", "Shaders/Fragment/disco_thicc_frag.fs", NULL);
	mNumShaders = mShaders.size();

	mpAudio->loadSongs();
}

void Graphics::userSetup(SetupStage stage)
{
	int sel;

	switch (stage)
	{
	case WINDOW:
		std::cout << "Select a mode to run by number" << std::endl;
		std::cout << "1. Fullscreen" << std::endl;
		std::cout << "2. Debug" << std::endl;
		std::cout << "Mode: ";
		std::cin >> sel;

		if (sel == 1)
		{
			GLFWmonitor *monitor = glfwGetPrimaryMonitor();
			const GLFWvidmode* mode = glfwGetVideoMode(monitor);
			this->setViewMode(ViewMode::VIEW_FULLSCREEN);
			mpWindow = glfwCreateWindow(mode->width, mode->height, "Don't do drugz", glfwGetPrimaryMonitor(), NULL);
		}
		else
		{
			if (sel != 2)
				std::cout << "Invalid input: Defaulting to Debug mode" << std::endl;

			this->setViewMode(ViewMode::VIEW_DEBUG);
			mpWindow = glfwCreateWindow(SCR_WIDTH, SCR_HEIGHT, "Don't do drugz", NULL, NULL);
		}
		break;

	case SHADER:
		std::cout << "Welcome to my visualizer, you're in for a good time" << std::endl;

		std::cout << "Would you like to select a shader program(0 for yes, 1 for no): ";
		std::cin >> sel;
		if (sel == 0)
			debugOutput(DebugOutputType::LIST_SHADERS, true);
		else if (sel == 1)
			debugOutput(DebugOutputType::CURRENT_SHADER, false);
		else
			std::cout << "Invalid input: Defaulting to first shader program" << std::endl;
		break;

	case SONG:
		std::cout << "Would you like to select a song(0 for yes, 1 for no): ";
		std::cin >> sel;
		if (sel == 0)
			debugOutput(DebugOutputType::LIST_SONGS, true);
		else if (sel == 1)
			debugOutput(DebugOutputType::CURRENT_SONG, false);
		else
			std::cout << "Invalid input: Defaulting to first song" << std::endl;

		break;

	case MUSIC_DIR: 
		std::cout << "Would you like to\n" << "1) Specify Music Directory\n" <<
			"2) Use Default Music Directory\n" <<
			"Selection: ";
		std::cin >> sel;

		if (sel == 1)
		{
			std::string dir;

			std::cout << "Paste Full Path to Directory: ";
			std::cin >> dir;

			if (dir.back() != '\\')
				dir += '\\';

			mpAudio->setMusicDir(dir);
		}
		else
		{
			if (sel != 2)
				std::cout << "Invalid input. ";
			std::cout << "Using default music directory\n";

			mpAudio->setMusicDir("Music/");

		}
		break;

	default:

		break;
	}
}

void Graphics::debugOutput(DebugOutputType type, bool isIO)
{
	switch (type)
	{
	case CURRENT_SONG:
		std::cout << "Currently playing song:\t\t" << mpAudio->getCurrentSongName() << std::endl;
		std::cout << "\n\n";
		break;

	case CURRENT_SHADER:
		std::cout << "Current Shader Program:\t\t" << mShaders[mCurShader]->getProgramName() << std::endl;	
		std::cout << "\n\n";
		break;

	case LIST_SHADERS:
		std::cout << "Shader programs: " << std::endl;
		for (int i = 0; i < mNumShaders; i++)
		{
			std::cout << i << ".\t\t" << mShaders[i]->getProgramName() << std::endl;
		}
		if (isIO)
		{
			int selShader;
			std::cout << "Select a shader by number: ";
			std::cin >> selShader;

			selectShader(selShader);
		}

		std::cout << "\n\n";
		break;

	case LIST_SONGS:
		for (int i = 0; i < mpAudio->getNumSongs(); i++)
		{
			std::cout << i << ".\t\t" << mpAudio->getSongName(i) << std::endl;
		}
		if (isIO)
		{
			int selSong;
			std::cout << "Select a song by number: ";
			std::cin >> selSong;

			mpAudio->selectSong(selSong);
		}
		std::cout << "\n\n";
		break;
	}
}

void Graphics::addShader(const char* name, unsigned int vID, unsigned int fID, unsigned int gID, const char* vPath, const char* fPath, const char* gPath)
{
	mShaders.push_back(new Shader(name, vID, fID, gID, vPath, fPath, gPath));
}

void Graphics::toggleShader(int prevNext)
{
	int curProg = (mCurShader + prevNext) % mNumShaders;
	mCurShader = curProg;

	mShaders[mCurShader]->use();
	this->reloadShader();

	this->debugOutput(DebugOutputType::CURRENT_SHADER, false);
	this->debugOutput(DebugOutputType::CURRENT_SONG, false);
}

void Graphics::selectShader(int i)
{
	if (i > mNumShaders || i < mNumShaders)
	{
		std::cout << i << " \tInvalid input" << std::endl;
		return;
	}

	mCurShader = i;
}

void Graphics::render()
{
	glfwSetInputMode(mpWindow, GLFW_CURSOR, GLFW_CURSOR_HIDDEN);
	// set up vertex data (and buffer(s)) and configure vertex attributes
	float vertices[] = {
		// positions				// colors					// texture coords
		1.0f,	1.0f,	0.0f,		1.0f,	0.0f,	0.0f,		1.0f,	1.0f,		// top right
		1.0f,	-1.0f,	0.0f,		0.0f,	1.0f,	0.0f,		1.0f,	0.0f,		// bottom right
		-1.0f,	-1.0f,	0.0f,		0.0f,	0.0f,	1.0f,		0.0f,	0.0f,		// bottom left
		-1.0f,	1.0f,	0.0f,		1.0f,	1.0f,	0.0f,		0.0f,	1.0f		// top left
	};
	unsigned int indices[] = {
		0, 1, 3,	// first triangle
		1, 2, 3		// second triangle
	};

	unsigned int VBO, VAO, EBO;
	glGenVertexArrays(1, &VAO);
	glGenBuffers(1, &VBO);
	glGenBuffers(1, &EBO);

	glBindVertexArray(VAO);

	glBindBuffer(GL_ARRAY_BUFFER, VBO);
	glBufferData(GL_ARRAY_BUFFER, sizeof(vertices), vertices, GL_STATIC_DRAW);

	glBindBuffer(GL_ELEMENT_ARRAY_BUFFER, EBO);
	glBufferData(GL_ELEMENT_ARRAY_BUFFER, sizeof(indices), indices, GL_STATIC_DRAW);

	// position attribute
	glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, 8 * sizeof(float), (void*)0);
	glEnableVertexAttribArray(0);

	// color attribute
	glVertexAttribPointer(1, 3, GL_FLOAT, GL_FALSE, 8 * sizeof(float), (void *)(3 * sizeof(float)));
	glEnableVertexAttribArray(1);

	// texcoord attribute
	glVertexAttribPointer(2, 2, GL_FLOAT, GL_FALSE, 8 * sizeof(float), (void *)(6 * sizeof(float)));
	glEnableVertexAttribArray(2);

	mpAudio->playSong();

	float lastFrame = (float)glfwGetTime(),
		curFrame = 0.0,
		dTime = 0.0;

	mpAudio->update();
	float lastFreq = mpAudio->getFreq(),
		curFreq = 0.0,
		dFreq = 0.0;

	glm::vec2 res(SCR_WIDTH, SCR_HEIGHT);

	// render loop
	while (!glfwWindowShouldClose(mpWindow))
	{
		// input
		processInput(mpWindow);

		mpAudio->update();

		curFreq = mpAudio->getFreq();
		dFreq = curFreq - lastFreq;
		mShaders[mCurShader]->setFloat("uFreq", curFreq);
		mShaders[mCurShader]->setFloat("uDeltaFreq", dFreq);
		mShaders[mCurShader]->setFloat("uLastFreq", lastFreq);
		lastFreq = curFreq;

		curFrame = (float)(glfwGetTime());
		dTime = curFrame - lastFrame;
		mShaders[mCurShader]->setFloat("uTime", curFrame);
		mShaders[mCurShader]->setFloat("uDeltaTime", dTime);
		mShaders[mCurShader]->setFloat("uLastFrame", lastFrame);
		lastFrame = curFrame;

		mShaders[mCurShader]->setFloatArray("uSpectrum", mpAudio->getSpectrumData(), mpAudio->getSpecSize());

		mShaders[mCurShader]->setVec2("uRes", res);

		mShaders[mCurShader]->use();
		glBindTexture(GL_TEXTURE_2D, GL_TEXTURE0);
		glBindVertexArray(VAO);
		glDrawElements(GL_TRIANGLES, 6, GL_UNSIGNED_INT, 0);


		// glfw: swap buffers and poll IO events (keys pressed/released, mouse moved etc.)
		glfwSwapBuffers(mpWindow);
		glfwPollEvents();
	}
}

void Graphics::reloadShader()
{
	std::string name = mShaders[mCurShader]->getProgramName();
	std::cout << "\n\nReloading Shader Program " << name << std::endl << std::endl;

	std::string vPath = mShaders[mCurShader]->getVertPath();
	std::string fPath = mShaders[mCurShader]->getFragPath();
	std::string gPath = mShaders[mCurShader]->getGeomPath();
	unsigned int vID = mShaders[mCurShader]->getVertID();
	unsigned int fID = mShaders[mCurShader]->getFragID();
	unsigned int gID = mShaders[mCurShader]->getGeomID();

	glDeleteProgram(mShaders[mCurShader]->getID());

	mShaders[mCurShader] = NULL;

	if (gPath.empty())
		mShaders[mCurShader] = new Shader(name.c_str(), vID, fID, 0, vPath.c_str(), fPath.c_str(), NULL);
	else
		mShaders[mCurShader] = new Shader(name.c_str(), vID, fID, gID, vPath.c_str(), fPath.c_str(), gPath.c_str());
}

void Graphics::hotReloadAudio(bool changeDir)
{
	std::string d = mpAudio->getMusicDir();
	mpAudio->unloadAudio();
	mpAudio = NULL;
	delete mpAudio;

	mpAudio = new Audio();
	if (changeDir)
		userSetup(SetupStage::MUSIC_DIR);
	else
		mpAudio->setMusicDir(d);
	mpAudio->loadSongs();

	mpAudio->playSong();
}

void Graphics::processInput(GLFWwindow *window)
{
	glfwSetInputMode(window, GLFW_STICKY_KEYS, GLFW_TRUE);

	// exit - ESCAPE
	if (glfwGetKey(window, GLFW_KEY_ESCAPE) == GLFW_PRESS)
		glfwSetWindowShouldClose(window, true);

	// toggle song : next song - RIGHT ARROW
	if (glfwGetKey(window, GLFW_KEY_RIGHT) == GLFW_PRESS)
		if (glfwGetKey(window, GLFW_KEY_RIGHT) == GLFW_RELEASE)
		{
			mpAudio->toggleSong(1);
			glfwSetTime(0.0);
			this->debugOutput(DebugOutputType::CURRENT_SONG, false);
		}

	// toggle song : previous song - LEFT ARROW
	if (glfwGetKey(window, GLFW_KEY_LEFT) == GLFW_PRESS)
		if (glfwGetKey(window, GLFW_KEY_LEFT) == GLFW_RELEASE)
		{
			mpAudio->toggleSong(mpAudio->getNumSongs() - 1);
			glfwSetTime(0.0);
			this->debugOutput(DebugOutputType::CURRENT_SONG, false);
		}

	// toggle shader programs : next shader program - UP ARROW
	if (glfwGetKey(window, GLFW_KEY_UP) == GLFW_PRESS)
		if (glfwGetKey(window, GLFW_KEY_UP) == GLFW_RELEASE)
			this->toggleShader(1);

	// toggle shader programs : previous shader program - DOWN ARROW
	if (glfwGetKey(window, GLFW_KEY_DOWN) == GLFW_PRESS)
		if (glfwGetKey(window, GLFW_KEY_DOWN) == GLFW_RELEASE)
			this->toggleShader(mNumShaders - 1);

	// shuffle songs - Q
	if (glfwGetKey(window, GLFW_KEY_Q) == GLFW_PRESS)
		if (glfwGetKey(window, GLFW_KEY_Q) == GLFW_RELEASE)
			mpAudio->toggleRand();

	if (mViewMode == ViewMode::VIEW_DEBUG)
	{
		// reload shader - R
		if (glfwGetKey(window, GLFW_KEY_R) == GLFW_PRESS)
			if (glfwGetKey(window, GLFW_KEY_R) == GLFW_RELEASE)
				this->reloadShader();
	}


	// Shift = No Input
	if (glfwGetKey(window, GLFW_KEY_LEFT_SHIFT) == GLFW_PRESS && glfwGetKey(window, GLFW_KEY_TAB) != GLFW_PRESS)
	{
		if (this->getViewMode() == ViewMode::VIEW_DEBUG)
		{
			// list shaders : dont change shader - SHIFT + S
			if (glfwGetKey(window, GLFW_KEY_S) == GLFW_PRESS)
				if (glfwGetKey(window, GLFW_KEY_S) == GLFW_RELEASE)
					debugOutput(DebugOutputType::LIST_SHADERS, false);

			// list songs : dont change song - SHIFT + A
			if (glfwGetKey(window, GLFW_KEY_A) == GLFW_PRESS)
				if (glfwGetKey(window, GLFW_KEY_A) == GLFW_RELEASE)
					debugOutput(DebugOutputType::LIST_SONGS, false);

			// current shader : dont change shader - SHIFT + Z
			if (glfwGetKey(window, GLFW_KEY_Z) == GLFW_PRESS)
				if (glfwGetKey(window, GLFW_KEY_Z) == GLFW_RELEASE)
					debugOutput(DebugOutputType::CURRENT_SHADER, false);

			// current song : dont change song - SHIFT + X
			if (glfwGetKey(window, GLFW_KEY_X) == GLFW_PRESS)
				if (glfwGetKey(window, GLFW_KEY_X) == GLFW_RELEASE)
					debugOutput(DebugOutputType::CURRENT_SONG, false);
		}

		// hot reload audio : dont change directory - SHIFT + B
		if (glfwGetKey(window, GLFW_KEY_B) == GLFW_PRESS)
			if (glfwGetKey(window, GLFW_KEY_B) == GLFW_RELEASE)
				hotReloadAudio(false);
	}

	// debug with input
	if (glfwGetKey(window, GLFW_KEY_TAB) == GLFW_PRESS && glfwGetKey(window, GLFW_KEY_LEFT_SHIFT) != GLFW_PRESS)
	{
		if (this->getViewMode() == ViewMode::VIEW_DEBUG)
		{
			// list shaders : change shader - TAB + S
			if (glfwGetKey(window, GLFW_KEY_S) == GLFW_PRESS)
				if (glfwGetKey(window, GLFW_KEY_S) == GLFW_RELEASE)
					debugOutput(DebugOutputType::LIST_SHADERS, true);

			// list songs : change song - TAB + A
			if (glfwGetKey(window, GLFW_KEY_A) == GLFW_PRESS)
				if (glfwGetKey(window, GLFW_KEY_A) == GLFW_RELEASE)
					debugOutput(DebugOutputType::LIST_SONGS, true);

			// current shader : change shader - TAB + Z
			if (glfwGetKey(window, GLFW_KEY_Z) == GLFW_PRESS)
				if (glfwGetKey(window, GLFW_KEY_Z) == GLFW_RELEASE)
					debugOutput(DebugOutputType::CURRENT_SHADER, true);

			// current song : change song - TAB + X
			if (glfwGetKey(window, GLFW_KEY_X) == GLFW_PRESS)
				if (glfwGetKey(window, GLFW_KEY_X) == GLFW_RELEASE)
					debugOutput(DebugOutputType::CURRENT_SONG, true);

			// hot reload audio : change directory - TAB + B
			if (glfwGetKey(window, GLFW_KEY_B) == GLFW_PRESS)
				if (glfwGetKey(window, GLFW_KEY_B) == GLFW_RELEASE)
					hotReloadAudio(true);
		}
	}
}

void Graphics::framebuffer_size_callback(GLFWwindow* window, int width, int height)
{
	glViewport(0, 0, width, height);
}

void Graphics::clean()
{
	glDeleteVertexArrays(1, &mVAO);
	glDeleteBuffers(1, &mVBO);

	glfwTerminate();

	mpAudio->unloadAudio();

	mpAudio = NULL;
	delete mpAudio;

	mShaders.clear();
}

Graphics::~Graphics()
{
	clean();
}