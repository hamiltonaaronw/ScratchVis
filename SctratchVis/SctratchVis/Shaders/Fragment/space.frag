#version 410

#define PI		3.1415926535897932384626433832795
#define TAU		(2.0 * PI)

in vec2 oTexCoord;

float scale;

uniform float uFreq;
uniform float uLastFreq;
uniform float uDeltaFreq;
uniform float uTime;
uniform vec2 uRes;
uniform float[256] uSpectrum;

out vec4 retColor;

float sinc(float x)
{
	return sin(x) / x;
}

float cosc(float x)
{
	return cos(x) / x;
}

mat2 rot(float a)
{
	return mat2(
		cos(a), sin(a),
		-sin(a), cos(a)
	);
}

vec3 hsv(float h, float s, float v)
{
	vec3 ret = ((clamp(abs(fract(h + vec3(0.0, 2.0, 1.0) / 3.0) * 6.0 - 3.0) - 1.0, 0.0, 1.0) - 1.0) * s + 1.0) * v;
	return ret;
}

vec3 col(vec2 p)
{
	vec3 ret;
	vec3 c = vec3(0.0);

	float t = (uTime + step(51.0, uTime) * 11.0);
	
	float x = mod(uFreq * 4.0, 1.0);
	float f = cos((sin(cos(x)) - sin(x) - x) + x * x);
	float tm = mod(uTime, PI / 10.0);
	float ff = smoothstep(min(f, tm), max(uFreq, tm) * uFreq, cosc(TAU) + uLastFreq);
	float tf = atan(tm, ff);
	float fsum = (uFreq - uLastFreq) + f + tm + ff + tf;

	t += sinc(fsum);

	vec3 r = vec3(uRes, 1.0);
	vec3 ro = vec3(0.0, 0.0, -2.0);
	vec3 rd = normalize(vec3((2.1 * p - r.xy) / r.x, 0.8));

	//ro.zx *= rot(t * 0.0);
	//rd.zx *= rot(t * 0.0);

	float _t = 0.0;
	float _f = 1.0;
	float _i = _f;
	float _h = _f;
	vec3 p3 = c;
	mat2 r1 = rot(0.1 + t * 0.03);

	for (int y = 0; y < 125; ++y)
	{
		if (_t >= 3.0)
			break;

			p3 = ro + rd * _t;

			for (int j = 0; j < 25; j++)
			{
				p3 = abs(p3.yzx) * 1.1 - vec3(0.044, 0.0, 0.22);
				p3.yz *= r1;
			}
			_h = length(p3 - vec3(clamp(p3.xy, -0.2, 0.8), 0.0)) * 0.14;
			_i = max(_h, 0.002) * _f;
			_t += _i;

			_h *= f;
			_t -= fsum;

			c += exp(2.0 - _t * 2.0) * 
				(cos(p3.x * 1.6 + vec3(9.0, 4.0 * sin(uTime / 3.0), 5.3))
				* 0.5 + 0.5)
				* max(0.0, _f - 4e2 * _h) * _i * 40.2;

			_f *= 1.005;
	}

	//c = vec3(1.0, 0.0, 0.0);
	//c = vec3(0.0, 1.0, 0.0);
	//c = vec3(0.0, 0.0, 1.0);

	ret = uFreq > 0.0001 ? c : vec3(0.0);

	return ret;
}

void main()
{
	vec2 uv;
	uv = gl_FragCoord.xy * 0.5;
	vec4 ret = vec4(col(uv), 1.0);

	retColor = ret;
}