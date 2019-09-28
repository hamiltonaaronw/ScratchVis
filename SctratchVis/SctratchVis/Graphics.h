#ifndef GRAPHICS_H
#define GRAPHICS_H

#include <include/glad/glad.h>
#include <GLFW/glfw3.h>
#include <iostream>
#include <sstream>
#include <string>
#include <map>

#include "Shaders/Shader.h"
#include "Audio/Audio.h"


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

enum ShaderProgram
{
	PSYCH,
	RETRO,
	DISCO,
	EYE,
	LIGHTS
};

class Graphics
{
private:
	// functions
	void addShader(ShaderProgram p, Shader *s);
	void clean();
	void debugOutput(DebugOutputType type, bool isIO);
	void hotReloadAudio(bool changeDir);
	void init();
	void processInput(GLFWwindow *window);
	void reloadShader();
	void selectShader(int i);
	void togglePauseSong();
	void toggleShader(int prevNext);
	void toggleTextRender();
	void userSetup(SetupStage stage);

	static void framebuffer_size_callback(GLFWwindow* window, int width, int height);

	// variables
	GLFWwindow *mpWindow;
	Audio *mpAudio;
	
	ShaderProgram mCurProg;
	ViewMode mViewMode;

	std::map<ShaderProgram, Shader*> mShaders;

	bool mRenderText;

	int mNumShaders;
	const unsigned int SCR_WIDTH = 800;
	const unsigned int SCR_HEIGHT = 600;
	unsigned int mVBO, mVAO, mEBO,
				mSWidth, mSHeight;

	// getters/setters
	void setViewMode(ViewMode m) { mViewMode = m; };
	ViewMode getViewMode() { return mViewMode; };

	void setCurProg(ShaderProgram p) { mCurProg = p; };
	ShaderProgram getCurProg() { return mCurProg; };

	void setRenderText(bool b) { mRenderText = b; };
	bool getRenderText() { return mRenderText; };

public:

	// functions
	void render();

	// constructor/destructor
	Graphics();
	~Graphics();
};

#endif