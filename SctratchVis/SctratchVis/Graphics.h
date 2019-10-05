#ifndef GRAPHICS_H
#define GRAPHICS_H

#include <include/glad/glad.h>
#include <GLFW/glfw3.h>
#include <iostream>
#include <sstream>
#include <string>
#include <map>

#include "ShaderManager.h"
#include "Shaders/Shader.h"
#include "Audio/Audio.h"
#include "Text.h"

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
	void debugOutput		(DebugOutputType type, bool isIO);
	void drawText			();
	void hotReloadAudio		(bool changeDir);
	void init				();
	void processInput		(GLFWwindow *window);
	void selectShader		(int i);
	void togglePauseSong	();
	void toggleTextRender	();
	void userSetup			(SetupStage stage);

	static void framebuffer_size_callback	(GLFWwindow* window, int width, int height);

	// variables
	GLFWwindow		*mpWindow;
	Audio			*mpAudio;
	Text			*mpText;
	ShaderManager	*mpShaderMan;
	
	ShaderProgram	 mCurProg;
	ViewMode		 mViewMode;
	AudioInputMode	 mAudioInputMode;

	bool mRenderText;

	int					mNumShaders;
	const unsigned int	SCR_WIDTH = 800,
						SCR_HEIGHT = 600;
	unsigned int		mVBO,
						mVAO, 
						mEBO,
						mSWidth, 
						mSHeight;


public:

	// functions
	void render();

	// getters/setters
	void setViewMode(ViewMode m) { mViewMode = m; };
	ViewMode getViewMode() { return mViewMode; };

	void setCurProg(ShaderProgram p) { mCurProg = p; };
	ShaderProgram getCurProg() { return mCurProg; };

	void setRenderText(bool b) { mRenderText = b; };
	bool getRenderText() { return mRenderText; };

	// constructor/destructor
	Graphics();
	~Graphics();
};

#endif