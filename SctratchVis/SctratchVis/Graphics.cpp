#include "Graphics.h"
#include "EventManager.h"

Graphics* gpGraphics = NULL;

Graphics::Graphics()
{
	//initAudio();
	//initGraphics();
	//init();
	initAll();
}

void Graphics::clean()
{
	glfwTerminate();

	glDeleteVertexArrays(1, &mVAO);
	glDeleteBuffers(1, &mVBO);

	if (mpAudio)
	{
		mpAudio = NULL;
		delete mpAudio;
	}

	if (mpText)
	{
		mpText = NULL;
		delete mpText;
	}

	if (mpShaderMan)
	{
		mpShaderMan = NULL;
		delete mpShaderMan;
	}

	if (mpEventMan)
	{
		mpEventMan = NULL;
		delete mpEventMan;
	}
}

void Graphics::close()
{
	glfwSetWindowShouldClose(mpWindow, true);
}

void Graphics::debugOutput(DebugOutputType type, bool isIO)
{
	switch (type)
	{
	case DebugOutputType::CURRENT_SONG:
		std::cout << "Currently playing song:\t\t" << mpAudio->getCurrentSongName() << std::endl;
		break;

	case DebugOutputType::CURRENT_SHADER:
		
		std::cout << "Current Shader Program:\t\t" << mpShaderMan->getCurrentShader()->getProgramName() << std::endl;
		break;

	case DebugOutputType::LIST_SHADERS:
		std::cout << "Shader programs: " << std::endl;
		for (int i = 0; i < mNumShaders; i++)
		{
			std::cout << i << ".\t\t" << mpShaderMan->getShaderName((ShaderProgram)i) << std::endl;
		}
		if (isIO)
		{
			int selShader;
			std::cout << "Select a shader by number: ";
			std::cin >> selShader;

			selectShader(selShader);
		}
		break;

	case DebugOutputType::LIST_SONGS:
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
		break;


	case DebugOutputType::SPACE:
		std::cout << "\n\n";

		break;

	default:

		break;
	}
}

void Graphics::drawText()
{

}

void Graphics::framebuffer_size_callback(GLFWwindow* window, int width, int height)
{
	glViewport(0, 0, width, height);
}

void Graphics::hotReloadAudio(bool changeDir)
{
	int iJunk = 0;
	std::string sJunk = "";
	std::string d = mpAudio->getMusicDir();
	mpAudio->unloadAudio();
	mpAudio = NULL;
	delete mpAudio;

	mpAudio = new Audio();
	if (changeDir)
		userSetup(SetupStage::MUSIC_DIR, iJunk, sJunk);
	else
		mpAudio->setMusicDir(d);
	mpAudio->loadSongs();

	mpAudio->playSong();
}

void Graphics::init()
{
	int iJunk = 0;
	std::string sJunk = "";
	this->setRenderText(false);

	mpText = new Text();

	glfwInit();
	glfwWindowHint(GLFW_CONTEXT_VERSION_MAJOR, 3);
	glfwWindowHint(GLFW_CONTEXT_VERSION_MINOR, 3);
	glfwWindowHint(GLFW_OPENGL_PROFILE, GLFW_OPENGL_CORE_PROFILE);
	glfwWindowHint(GLFW_RESIZABLE, GL_TRUE);
	glfwWindowHint(GLFW_MAXIMIZED, GL_TRUE);

	mpAudio = new Audio();
	mpEventMan = new EventManager();

	this->userSetup(SetupStage::MUSIC_DIR, iJunk, sJunk);
	mpAudio->loadSongs();

//	this->userSetup(SetupStage::SONG, iJunk, sJunk);

	this->userSetup(SetupStage::WINDOW, iJunk, sJunk);

	switch (mViewMode)
	{
	case ViewMode::VIEW_DEBUG:
		msWidth = 800;
		msHeight = 600;
		mpWindow = glfwCreateWindow(800, 600, "Don't do drugz", NULL, NULL);

		break;

	case ViewMode::VIEW_FULLSCREEN:
		GLFWmonitor *monitor = glfwGetPrimaryMonitor();
		const GLFWvidmode* mode = glfwGetVideoMode(monitor);
		mpWindow = glfwCreateWindow(mode->width, mode->height, "Don't do drugz", glfwGetPrimaryMonitor(), NULL);
		break;
	}

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

	this->userSetup(SetupStage::CLEAR_SCREEN, iJunk, sJunk);

	mpShaderMan = new ShaderManager();
	mNumShaders = mpShaderMan->getNumShaders();
}

void Graphics::initAll()
{
	int n = 0;
	std::string songDir = "";
	this->userSetup(SetupStage::MUSIC_DIR, n, songDir);
	//this->userSetup(SetupStage::SONG, n, songDir);
	this->userSetup(SetupStage::WINDOW, n, songDir);

	std::thread tAudio(initAudioWrapper, this, songDir);
	//	std::thread tGraphics(initGraphicsWrapper,	this);
	std::thread tShaders(initShadersWrapper, this);

	tAudio.join();
	tShaders.join();
	//	tGraphics.join();

	this->initGraphics();

	this->userSetup(SetupStage::CLEAR_SCREEN, n, songDir);

	if (!mAudioInit || !mShadersInit)
	{
		std::cout << "Something went wrong with initializing ";
		if (!mAudioInit)
		{
			std::cout << "AUDIO ";
			if (!mShadersInit)
				std::cout << " and SHADERS\n";
		}
		else
			if (!mShadersInit)
				std::cout << " SHADERS\n";

		std::cout << "Closing the program\n";

		std::exit(0);
	}
}

void Graphics::initAudio(std::string s)
{
	mpAudio = new Audio();
	mpAudio->setMusicDir(s);
	mpAudio->loadSongs();

	if (mpAudio)
		this->mAudioInit = true;

	mpEventMan = new EventManager();
}

void Graphics::initGraphics()
{
	this->mGraphicsInit = false;
	this->setRenderText(false);

	mpText = new Text();

	glfwInit();
	glfwWindowHint(GLFW_CONTEXT_VERSION_MAJOR, 3);
	glfwWindowHint(GLFW_CONTEXT_VERSION_MINOR, 3);
	glfwWindowHint(GLFW_OPENGL_PROFILE, GLFW_OPENGL_CORE_PROFILE);
	glfwWindowHint(GLFW_RESIZABLE, GL_TRUE);
	glfwWindowHint(GLFW_MAXIMIZED, GL_TRUE);

	switch (mViewMode)
	{
	case ViewMode::VIEW_DEBUG:
		msWidth = 800;
		msHeight = 600;
		mpWindow = glfwCreateWindow(800, 600, "Don't do drugz", NULL, NULL);

		break;

	case ViewMode::VIEW_FULLSCREEN:
		GLFWmonitor *monitor = glfwGetPrimaryMonitor();
		const GLFWvidmode* mode = glfwGetVideoMode(monitor);
		mpWindow = glfwCreateWindow(mode->width, mode->height, "Don't do drugz", glfwGetPrimaryMonitor(), NULL);
		break;
	}

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


	this->mGraphicsInit = true;
}

void Graphics::initShaders()
{
	this->mShadersInit = false;

	mpShaderMan = new ShaderManager();

	if (!mpShaderMan)
		return;
	mNumShaders = mpShaderMan->getNumShaders();

	this->mShadersInit = true;
}

void Graphics::processInput(GLFWwindow *window)
{
	glfwSetInputMode(window, GLFW_STICKY_KEYS, GLFW_TRUE);

	// exit - ESCAPE
	if (glfwGetKey(window, GLFW_KEY_ESCAPE) == GLFW_PRESS)
		mpEventMan->addEvent(new InputEvent(InputKey::ESC), 0);

	// toggle song : next song - RIGHT ARROW
	if (glfwGetKey(window, GLFW_KEY_RIGHT) == GLFW_PRESS)
		if (glfwGetKey(window, GLFW_KEY_RIGHT) == GLFW_RELEASE)
			mpEventMan->addEvent(new InputEvent(InputKey::RIGHT), 0);

	// toggle song : previous song - LEFT ARROW
	if (glfwGetKey(window, GLFW_KEY_LEFT) == GLFW_PRESS)
		if (glfwGetKey(window, GLFW_KEY_LEFT) == GLFW_RELEASE)
			mpEventMan->addEvent(new InputEvent(InputKey::LEFT), 0);

	// toggle shader programs : next shader program - UP ARROW
	if (glfwGetKey(window, GLFW_KEY_UP) == GLFW_PRESS)
		if (glfwGetKey(window, GLFW_KEY_UP) == GLFW_RELEASE)
			mpEventMan->addEvent(new InputEvent(InputKey::UP), 0);

	// toggle shader programs : previous shader program - DOWN ARROW
	if (glfwGetKey(window, GLFW_KEY_DOWN) == GLFW_PRESS)
		if (glfwGetKey(window, GLFW_KEY_DOWN) == GLFW_RELEASE)
			mpEventMan->addEvent(new InputEvent(InputKey::DOWN), 0);

	// shuffle songs - Q
	if (glfwGetKey(window, GLFW_KEY_Q) == GLFW_PRESS)
		if (glfwGetKey(window, GLFW_KEY_Q) == GLFW_RELEASE)
			mpEventMan->addEvent(new InputEvent(InputKey::Q), 0);

	if (mViewMode == ViewMode::VIEW_DEBUG)
	{
		// reload shader - R
		if (glfwGetKey(window, GLFW_KEY_R) == GLFW_PRESS)
			if (glfwGetKey(window, GLFW_KEY_R) == GLFW_RELEASE)
				mpEventMan->addEvent(new InputEvent(InputKey::R), 0);
	}

	// pause/resume song - SPACE
	if (glfwGetKey(window, GLFW_KEY_SPACE) == GLFW_PRESS)
		if (glfwGetKey(window, GLFW_KEY_SPACE) == GLFW_RELEASE)
			mpEventMan->addEvent(new InputEvent(InputKey::SPACE_KEY), 0);


	// Shift = No Input
	if (glfwGetKey(window, GLFW_KEY_LEFT_SHIFT) == GLFW_PRESS && glfwGetKey(window, GLFW_KEY_TAB) != GLFW_PRESS)
	{
		if (this->getViewMode() == ViewMode::VIEW_DEBUG)
		{
			// list shaders : dont change shader - SHIFT + S
			if (glfwGetKey(window, GLFW_KEY_S) == GLFW_PRESS)
				if (glfwGetKey(window, GLFW_KEY_S) == GLFW_RELEASE)
					mpEventMan->addEvent(new InputEvent(InputKey::SHIFT_S), 0);

			// list songs : dont change song - SHIFT + A
			if (glfwGetKey(window, GLFW_KEY_A) == GLFW_PRESS)
				if (glfwGetKey(window, GLFW_KEY_A) == GLFW_RELEASE)
					mpEventMan->addEvent(new InputEvent(InputKey::SHIFT_A), 0);

			// current shader : dont change shader - SHIFT + Z
			if (glfwGetKey(window, GLFW_KEY_Z) == GLFW_PRESS)
				if (glfwGetKey(window, GLFW_KEY_Z) == GLFW_RELEASE)
					mpEventMan->addEvent(new InputEvent(InputKey::SHIFT_Z), 0);

			// current song : dont change song - SHIFT + X
			if (glfwGetKey(window, GLFW_KEY_X) == GLFW_PRESS)
				if (glfwGetKey(window, GLFW_KEY_X) == GLFW_RELEASE)
					mpEventMan->addEvent(new InputEvent(InputKey::SHIFT_X), 0);
		}

		// hot reload audio : dont change directory - SHIFT + B
		if (glfwGetKey(window, GLFW_KEY_B) == GLFW_PRESS)
			if (glfwGetKey(window, GLFW_KEY_B) == GLFW_RELEASE)
				mpEventMan->addEvent(new InputEvent(InputKey::SHIFT_B), 0);
	}

	// debug with input
	if (glfwGetKey(window, GLFW_KEY_TAB) == GLFW_PRESS && glfwGetKey(window, GLFW_KEY_LEFT_SHIFT) != GLFW_PRESS)
	{
		if (this->getViewMode() == ViewMode::VIEW_DEBUG)
		{
			// list shaders : change shader - TAB + S
			if (glfwGetKey(window, GLFW_KEY_S) == GLFW_PRESS)
				if (glfwGetKey(window, GLFW_KEY_S) == GLFW_RELEASE)
					mpEventMan->addEvent(new InputEvent(InputKey::TAB_S), 0);

			// list songs : change song - TAB + A
			if (glfwGetKey(window, GLFW_KEY_A) == GLFW_PRESS)
				if (glfwGetKey(window, GLFW_KEY_A) == GLFW_RELEASE)
					mpEventMan->addEvent(new InputEvent(InputKey::TAB_A), 0);

			// current shader : change shader - TAB + Z
			if (glfwGetKey(window, GLFW_KEY_Z) == GLFW_PRESS)
				if (glfwGetKey(window, GLFW_KEY_Z) == GLFW_RELEASE)
					mpEventMan->addEvent(new InputEvent(InputKey::TAB_Z), 0);

			// current song : change song - TAB + X
			if (glfwGetKey(window, GLFW_KEY_X) == GLFW_PRESS)
				if (glfwGetKey(window, GLFW_KEY_X) == GLFW_RELEASE)
					mpEventMan->addEvent(new InputEvent(InputKey::TAB_X), 0);

			// hot reload audio : change directory - TAB + B
			if (glfwGetKey(window, GLFW_KEY_B) == GLFW_PRESS)
				if (glfwGetKey(window, GLFW_KEY_B) == GLFW_RELEASE)
					mpEventMan->addEvent(new InputEvent(InputKey::TAB_B), 0);
		}
	}

	if (mViewMode == ViewMode::VIEW_FULLSCREEN)
	{
		// toggle text rendering to screen - T
		if (glfwGetKey(window, GLFW_KEY_T) == GLFW_PRESS)
			if (glfwGetKey(window, GLFW_KEY_T) == GLFW_RELEASE)
				toggleTextRender();
	}
}

void Graphics::render()
{
	mpShaderMan->toggleShader(0);
	this->debugOutput(DebugOutputType::CURRENT_SHADER, false);
	this->debugOutput(DebugOutputType::CURRENT_SONG, false);

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

	// position attribute1
	glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, 8 * sizeof(float), (void*)0);
	glEnableVertexAttribArray(0);

	// color attribute
	glVertexAttribPointer(1, 3, GL_FLOAT, GL_FALSE, 8 * sizeof(float), (void *)(3 * sizeof(float)));
	glEnableVertexAttribArray(1);

	// texcoord attribute
	glVertexAttribPointer(2, 2, GL_FLOAT, GL_FALSE, 8 * sizeof(float), (void *)(6 * sizeof(float)));
	glEnableVertexAttribArray(2);

	mpAudio->playSong();

	float lastFrame = this->getCurTime(),
		curFrame = 0.0,
		dTime = 0.0;

	mpAudio->update();
	float lastFreq = mpAudio->getFreq(),
		curFreq = 0.0,
		dFreq = 0.0;

	// render loop
	while (!glfwWindowShouldClose(mpWindow))
	{
		// input
		processInput(mpWindow);

		if (!mpAudio->update())
			mpEventMan->addEvent(new SongEndEvent(), 1);

		if (!mpAudio->getIsPaused())
		{
			// send frequency uniforms to the shader
			curFreq = mpAudio->getFreq();
			dFreq = curFreq - lastFreq;
			mpShaderMan->getCurrentShader()->setFloatArray("uSpectrum", mpAudio->getSpectrumData(), mpAudio->getSpecSize());
			mpShaderMan->getCurrentShader()->setFloat("uFreq", curFreq);
			mpShaderMan->getCurrentShader()->setFloat("uDeltaFreq", dFreq);
			mpShaderMan->getCurrentShader()->setFloat("uLastFreq", lastFreq);
			lastFreq = curFreq;
			
			// send time uniforms to the shader
			curFrame = this->getCurTime();
			dTime = curFrame - lastFrame;
			mpShaderMan->getCurrentShader()->setFloat("uTime", curFrame);
			mpShaderMan->getCurrentShader()->setFloat("uDeltaTime", dTime);
			mpShaderMan->getCurrentShader()->setFloat("uLastFrame", lastFrame);
		}
		else
			glfwSetTime(curFrame);

		int w, h;
		glfwGetFramebufferSize(mpWindow, &w, &h);

		mpShaderMan->getCurrentShader()->setVec2("uRes", glm::vec2((float)w / 2.0, (float)h / 2.0));
		mpShaderMan->use();
		glBindTexture(GL_TEXTURE_2D, GL_TEXTURE0);
		glBindVertexArray(VAO);
		glDrawElements(GL_TRIANGLES, 6, GL_UNSIGNED_INT, 0);


		// glfw: swap buffers and poll IO events (keys pressed/released, mouse moved etc.)
		glfwSwapBuffers(mpWindow);
		glfwPollEvents();

		mpEventMan->processEvents();
	}
}

void Graphics::selectShader(int i)
{
	if (i > mNumShaders || i < mNumShaders)
	{
		std::cout << i << " \tInvalid input" << std::endl;
		return;
	}

	mpShaderMan->setCurProg((ShaderProgram)i);

	this->debugOutput(DebugOutputType::CURRENT_SHADER, false);
	this->debugOutput(DebugOutputType::CURRENT_SONG, false);
	this->debugOutput(DebugOutputType::SPACE, false);
}

void Graphics::togglePauseSong()
{
	mpAudio->togglePause();
}

void Graphics::toggleShader(int prevNext)
{
	mpShaderMan->toggleShader(prevNext);
	this->debugOutput(DebugOutputType::CURRENT_SHADER, false);
	this->debugOutput(DebugOutputType::SPACE, false);
}

void Graphics::toggleSong(int prevNext)
{
	mpAudio->toggleSong(prevNext);
	glfwSetTime(0.0);
	this->debugOutput(DebugOutputType::CURRENT_SONG, false);
	this->debugOutput(DebugOutputType::SPACE, false);
}

void Graphics::toggleTextRender()
{
	this->setRenderText(!this->getRenderText());
}

void Graphics::userSetup(SetupStage stage, int &n, std::string &s)
{
	int sel;

	switch (stage)
	{
	case SetupStage::WINDOW:
		std::cout << "Select a mode to run by number" << std::endl;
		std::cout << "1. Fullscreen" << std::endl;
		std::cout << "2. Debug" << std::endl;
		std::cout << "Mode: ";
		std::cin >> sel;

		if (sel == 1)
			this->setViewMode(ViewMode::VIEW_FULLSCREEN);
		else
		{
			if (sel != 2)
				std::cout << "Invalid input: Defaulting to Debug mode" << std::endl;
			this->setViewMode(ViewMode::VIEW_DEBUG);
		}
		break;

	case SetupStage::SHADER:
		std::cout << "Would you like to select a shader program(0 for yes, 1 for no): ";
		std::cin >> sel;
		if (sel == 0)
			debugOutput(DebugOutputType::LIST_SHADERS, true);
		else if (sel == 1)
			debugOutput(DebugOutputType::CURRENT_SHADER, false);
		else
			std::cout << "Invalid input: Defaulting to first shader program" << std::endl;
		break;

	case SetupStage::SONG:
		std::cout << "Would you like to select a song(0 for yes, 1 for no): ";
		std::cin >> sel;
		if (sel == 0)
			debugOutput(DebugOutputType::LIST_SONGS, true);
		else
		{
			if (sel != 1)
				std::cout << "Invalid input:";
			std::cout << "Defaulting to first song" << std::endl;
		}

		break;

	case SetupStage::MUSIC_DIR: 
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

			s = dir;
			//mpAudio->setMusicDir(dir);
		}
		else
		{
			if (sel != 2)
				std::cout << "Invalid input. ";
			std::cout << "Using default music directory\n";

			s = "Music/";
			//mpAudio->setMusicDir("Music/");
		}
		break;

	case SetupStage::CLEAR_SCREEN:
		system("CLS");
		break;

	default:

		break;
	}
}

Graphics::~Graphics()
{
	clean();
}