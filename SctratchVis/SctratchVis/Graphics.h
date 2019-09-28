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
	void clean();

	void processInput(GLFWwindow *window);
	static void framebuffer_size_callback(GLFWwindow* window, int width, int height);
	void reloadShader();
	void toggleShader(int prevNext);
	void selectShader(int i);
	void hotReloadAudio(bool changeDir);

	void userSetup(SetupStage stage);
	void debugOutput(DebugOutputType type, bool isIO);

	unsigned int mVBO, mVAO, mEBO;

	GLFWwindow *mpWindow;
	Audio *mpAudio;

	std::map<ShaderProgram, Shader*> mShaders;
	int mNumShaders;

	const unsigned int SCR_WIDTH = 800;
	const unsigned int SCR_HEIGHT = 600;

	unsigned int mSWidth, mSHeight;

	ShaderProgram mCurProg;
	ViewMode mViewMode;

	void setViewMode(ViewMode m) { mViewMode = m; };
	ViewMode getViewMode() { return mViewMode; };

	void setCurProg(ShaderProgram p) { mCurProg = p; };
	ShaderProgram getCurProg() { return mCurProg; };

	void toggleTextRender();
	bool mRenderText;
	void setRenderText(bool b) { mRenderText = b; };
	bool getRenderText() { return mRenderText; };
	void togglePauseSong();

	void addShader(ShaderProgram p, Shader *s);

public:

	void init();
	void render();

	Graphics();
	~Graphics();
};

#endif