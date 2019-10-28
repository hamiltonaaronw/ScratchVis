#pragma once

#include <include/glad/glad.h>
#include <GLFW/glfw3.h>
#include <iostream>
#include <sstream>
#include <string>
#include <map>
#include <thread>
//#include "EventManager.h"

#include "ShaderManager.h"
//#include "Shaders/Shader.h"
#include "Audio/Audio.h"
#include "Text.h"

class Audio;
class EventManager;
class ShaderManager;
class Text;

enum AudioInputMode
{
	AUDIO_PRE_INPUT,	// pre-recorded signal processing
	AUDIO_REAL_INPUT	// live audio input real-time signal processing
};

enum ViewMode
{
	VIEW_DEBUG,
	VIEW_FULLSCREEN
};

enum DebugOutputType
{
	CURRENT_SONG,
	CURRENT_SHADER,
	LIST_SHADERS,
	LIST_SONGS,
	SPACE
};

enum SetupStage
{
	WINDOW,
	SONG,
	SHADER,
	MUSIC_DIR,
	CLEAR_SCREEN
};

class Graphics
{
private:
	// functions
	void clean				();
	void drawText			();
	void hotReloadAudio		(bool changeDir);
	void init				();
	void initAll			();
	void initAudio			(std::string s);
	void initGraphics		();
	void initShaders		();
	void processInput		(GLFWwindow *window);
	void selectShader		(int i);
	void togglePauseSong	();
	void toggleShader		(int prevNext);
	void toggleSong			(int prevNext);
	void toggleTextRender	();
	void userSetup			(SetupStage stage, int &n, std::string &s);

	static void initAudioWrapper		(Graphics *g, std::string s)	{ if (!g) return; g->initAudio(s); };
	static void initGraphicsWrapper		(Graphics *g)					{ if (!g) return; g->initGraphics(); };
	static void initShadersWrapper		(Graphics *g)					{ if (!g) return; g->initShaders(); };

	static void framebuffer_size_callback	(GLFWwindow* window, int width, int height);

	// variables
	GLFWwindow			*mpWindow;
	Audio				*mpAudio;
	Text				*mpText;
	ShaderManager		*mpShaderMan;
	EventManager		*mpEventMan;
	
	ShaderProgram		mCurProg;
	ViewMode			mViewMode;
	AudioInputMode		mAudioInputMode;

	bool				mRenderText,
						mAudioInit,
						mGraphicsInit,
						mShadersInit;

	int					mNumShaders;
	unsigned int		msWidth,
						msHeight,
						mVBO,
						mVAO, 
						mEBO,
						mSWidth, 
						mSHeight;


public:

	// functions
	void close();
	void render();

	// getters/setters
	void setViewMode(ViewMode m)		{ mViewMode = m; };
	ViewMode getViewMode()				{ return mViewMode; };

	void setCurProg(ShaderProgram p)	{ mCurProg = p; };
	ShaderProgram getCurProg()			{ return mCurProg; };

	void setRenderText(bool b)			{ mRenderText = b; };
	bool getRenderText()				{ return mRenderText; };

	float getCurTime()					{ return (float)glfwGetTime(); };
	void setTime(float t)				{ glfwSetTime(t); };

	Audio* getAudioDev() { return mpAudio; };

	void debugOutput(DebugOutputType type, bool isIO);

	// public wrapper functions
	void debug_Wrapper(DebugOutputType t, bool in)		{this->debugOutput(t, in);		};
	void reloadAudio_Wrapper(bool cDir)					{this->hotReloadAudio(cDir);	};
	void reloadShader_Wrapper()							{mpShaderMan->reloadShader();	};
	void togglePauseSong_Wrapper()						{this->togglePauseSong();		};
	void toggleRand_Wrapper()							{mpAudio->toggleRand();			};
	void toggleShader_Wrapper(int i)					{this->toggleShader(i);			};
	void toggleSong_Wrapper(int i)						{this->toggleSong(i);			};

	// constructor/destructor
	Graphics();
	~Graphics();
};

extern Graphics* gpGraphics;